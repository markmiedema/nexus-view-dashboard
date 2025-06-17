
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

    // Parse CSV data (simplified for demo)
    const csvText = await fileData.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim())
    
    console.log('CSV headers:', headers)
    console.log('Total lines:', lines.length - 1)

    // Mock processing - in real implementation, you'd parse and validate the CSV
    // and insert rows into sales_events table
    const mockInserted = Math.max(1, lines.length - 1)
    const mockStatesCrossed = ['CA', 'NY']

    // Simulate calling compute_nexus function
    const { error: computeError } = await supabase.rpc('compute_nexus', {
      p_org: org_id
    })

    if (computeError) {
      console.error('Compute nexus error:', computeError)
    }

    console.log('Processing complete:', { inserted: mockInserted, states_crossed: mockStatesCrossed })

    return new Response(
      JSON.stringify({
        success: true,
        inserted: mockInserted,
        states_crossed: mockStatesCrossed
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
