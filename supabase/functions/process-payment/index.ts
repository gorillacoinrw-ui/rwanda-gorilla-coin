import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY')
    if (!FLUTTERWAVE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Flutterwave API key not configured. Please add FLUTTERWAVE_SECRET_KEY secret.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { action, amount, phone_number, currency = 'RWF', network = 'MTN' } = body

    if (action === 'deposit') {
      // Initialize Flutterwave payment
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: `GOR-DEP-${user.id}-${Date.now()}`,
          amount,
          currency,
          payment_options: 'mobilemoneyrwanda',
          customer: {
            email: user.email,
            phonenumber: phone_number,
          },
          customizations: {
            title: 'Gorilla Coin Deposit',
            description: `Deposit ${amount} ${currency} to Gorilla Coin`,
          },
          meta: {
            user_id: user.id,
            type: 'deposit',
          },
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(`Flutterwave error [${response.status}]: ${JSON.stringify(data)}`)
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'withdraw') {
      // Initialize Flutterwave transfer (payout)
      const response = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_bank: network === 'MTN' ? 'MPS' : 'MPS',
          account_number: phone_number,
          amount,
          currency,
          reference: `GOR-WDR-${user.id}-${Date.now()}`,
          callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
          meta: {
            user_id: user.id,
            type: 'withdrawal',
          },
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(`Flutterwave error [${response.status}]: ${JSON.stringify(data)}`)
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Flutterwave payment error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
