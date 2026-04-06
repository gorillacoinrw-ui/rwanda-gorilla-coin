import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET')

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return new Response(
        JSON.stringify({ error: 'PayPal credentials not configured. Please add PAYPAL_CLIENT_ID and PAYPAL_SECRET secrets.' }),
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

    // Get PayPal access token
    const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      throw new Error(`PayPal auth error [${tokenRes.status}]: ${JSON.stringify(tokenData)}`)
    }

    const body = await req.json()
    const { action, amount, currency = 'USD' } = body

    if (action === 'create-order') {
      const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: { currency_code: currency, value: String(amount) },
            description: `Gorilla Coin Deposit - ${amount} ${currency}`,
            custom_id: user.id,
          }],
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        throw new Error(`PayPal order error [${orderRes.status}]: ${JSON.stringify(orderData)}`)
      }

      return new Response(JSON.stringify({ success: true, data: orderData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'capture-order') {
      const { order_id } = body
      const captureRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${order_id}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const captureData = await captureRes.json()
      if (!captureRes.ok) {
        throw new Error(`PayPal capture error [${captureRes.status}]: ${JSON.stringify(captureData)}`)
      }

      // TODO: Update user balance after successful capture
      // const gorCoins = convertToGOR(amount, currency);
      // await supabase.from('profiles').update({ coin_balance: ... })

      return new Response(JSON.stringify({ success: true, data: captureData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('PayPal payment error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
