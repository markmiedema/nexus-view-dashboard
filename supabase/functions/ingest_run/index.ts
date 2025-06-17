
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { bucket, path, org_id } = await req.json()
    
    console.log('Processing file:', { bucket, path, org_id })

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path)

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`)
    }

    // Parse CSV data
    const csvText = await fileData.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    console.log('CSV headers:', headers)
    console.log('Total lines:', lines.length - 1)

    // Parse CSV rows and insert into sales_events
    const salesEvents = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      
      if (values.length >= headers.length) {
        const event = {
          org_id: org_id,
          transaction_id: values[headers.indexOf('transaction_id')] || `tx_${i}`,
          transaction_date: values[headers.indexOf('transaction_date')] || new Date().toISOString(),
          transaction_type: values[headers.indexOf('transaction_type')] || 'sale',
          amount: parseFloat(values[headers.indexOf('amount')] || '0'),
          shipping: parseFloat(values[headers.indexOf('shipping')] || '0'),
          sales_tax: parseFloat(values[headers.indexOf('sales_tax')] || '0'),
          currency: values[headers.indexOf('currency')] || 'USD',
          provider: values[headers.indexOf('provider')] || 'unknown',
          marketplace_facilitator: values[headers.indexOf('marketplace_facilitator')] === 'true',
          customer_id: values[headers.indexOf('customer_id')] || null,
          exemption_type: values[headers.indexOf('exemption_type')] || 'non_exempt',
          ship_to_state: values[headers.indexOf('ship_to_state')] || 'CA',
          ship_to_zip: values[headers.indexOf('ship_to_zip')] || null,
          ship_to_city: values[headers.indexOf('ship_to_city')] || null
        }
        
        salesEvents.push(event)
      }
    }

    console.log('Parsed sales events:', salesEvents.length)

    // Insert sales events into database
    const { data: insertedData, error: insertError } = await supabase
      .from('sales_events')
      .insert(salesEvents)

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Insert failed: ${insertError.message}`)
    }

    console.log('Successfully inserted sales events')

    // Call compute_nexus function to analyze the data
    const { error: computeError } = await supabase.rpc('compute_nexus', {
      p_org: org_id
    })

    if (computeError) {
      console.error('Compute nexus error:', computeError)
      throw new Error(`Compute nexus failed: ${computeError.message}`)
    }

    console.log('Successfully computed nexus analysis')

    // Get the states that crossed nexus
    const { data: nexusData, error: nexusError } = await supabase
      .from('nexus_status')
      .select('state')
      .eq('org_id', org_id)
      .not('crossed_at', 'is', null)

    const statesCrossed = nexusData ? nexusData.map(row => row.state) : []

    console.log('Processing complete:', { inserted: salesEvents.length, states_crossed: statesCrossed })

    return new Response(
      JSON.stringify({
        success: true,
        inserted: salesEvents.length,
        states_crossed: statesCrossed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error processing file:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
