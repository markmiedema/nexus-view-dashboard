import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Header mapping for different CSV formats
const headerMappings = {
  // Amount mappings
  'amount': ['amount', 'sale amount', 'revenue', 'total', 'price'],
  // Date mappings
  'transaction_date': ['transaction_date', 'date', 'transaction date', 'sale_date', 'order_date'],
  // State mappings
  'ship_to_state': ['ship_to_state', 'state', 'ship state', 'destination_state'],
  // Transaction ID mappings
  'transaction_id': ['transaction_id', 'transaction id', 'order_id', 'sale_id', 'id'],
  // Other mappings
  'ship_to_zip': ['ship_to_zip', 'zip code', 'zip', 'postal_code'],
  'ship_to_city': ['ship_to_city', 'city', 'destination_city'],
  'transaction_type': ['transaction_type', 'type', 'revenue type'],
  'currency': ['currency', 'curr'],
  'provider': ['provider', 'platform', 'source'],
  'marketplace_facilitator': ['marketplace_facilitator', 'marketplace facilitator', 'facilitator'],
  'customer_id': ['customer_id', 'customer id', 'buyer_id'],
  'exemption_type': ['exemption_type', 'exemption certificate', 'exempt'],
  'shipping': ['shipping', 'ship_cost', 'delivery_fee'],
  'sales_tax': ['sales_tax', 'tax', 'tax_amount']
}

function findHeaderIndex(headers: string[], fieldMappings: string[]): number {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const mapping of fieldMappings) {
    const index = normalizedHeaders.indexOf(mapping.toLowerCase());
    if (index !== -1) return index;
  }
  return -1;
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

    // Create header index mappings
    const headerIndexes: Record<string, number> = {}
    
    for (const [field, mappings] of Object.entries(headerMappings)) {
      headerIndexes[field] = findHeaderIndex(headers, mappings);
    }

    console.log('Header mappings found:', headerIndexes)

    // Parse CSV rows and insert into sales_events
    const salesEvents = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      
      if (values.length >= headers.length) {
        const event = {
          org_id: org_id,
          transaction_id: headerIndexes.transaction_id >= 0 ? 
            (values[headerIndexes.transaction_id] || `tx_${i}`) : `tx_${i}`,
          transaction_date: headerIndexes.transaction_date >= 0 ? 
            (values[headerIndexes.transaction_date] || new Date().toISOString()) : new Date().toISOString(),
          transaction_type: headerIndexes.transaction_type >= 0 ? 
            (values[headerIndexes.transaction_type] || 'sale') : 'sale',
          amount: headerIndexes.amount >= 0 ? 
            parseFloat(values[headerIndexes.amount]?.replace(/[$,]/g, '') || '0') : 0,
          shipping: headerIndexes.shipping >= 0 ? 
            parseFloat(values[headerIndexes.shipping]?.replace(/[$,]/g, '') || '0') : 0,
          sales_tax: headerIndexes.sales_tax >= 0 ? 
            parseFloat(values[headerIndexes.sales_tax]?.replace(/[$,]/g, '') || '0') : 0,
          currency: headerIndexes.currency >= 0 ? 
            (values[headerIndexes.currency] || 'USD') : 'USD',
          provider: headerIndexes.provider >= 0 ? 
            (values[headerIndexes.provider] || 'unknown') : 'unknown',
          marketplace_facilitator: headerIndexes.marketplace_facilitator >= 0 ? 
            (values[headerIndexes.marketplace_facilitator]?.toLowerCase() === 'true' || 
             values[headerIndexes.marketplace_facilitator]?.toLowerCase() === 'yes') : false,
          customer_id: headerIndexes.customer_id >= 0 ? 
            (values[headerIndexes.customer_id] || null) : null,
          exemption_type: headerIndexes.exemption_type >= 0 ? 
            (values[headerIndexes.exemption_type] || 'non_exempt') : 'non_exempt',
          ship_to_state: headerIndexes.ship_to_state >= 0 ? 
            (values[headerIndexes.ship_to_state] || 'CA') : 'CA',
          ship_to_zip: headerIndexes.ship_to_zip >= 0 ? 
            (values[headerIndexes.ship_to_zip] || null) : null,
          ship_to_city: headerIndexes.ship_to_city >= 0 ? 
            (values[headerIndexes.ship_to_city] || null) : null
        }
        
        salesEvents.push(event)
      }
    }

    console.log('Parsed sales events:', salesEvents.length)
    console.log('Sample event:', salesEvents[0])

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
