package rw.vuka.deliver

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

/**
 * Handles deep links from MTN MoMo / Airtel Money payment callbacks.
 *
 * When a payment completes, the provider redirects to:
 *   vuka://payment?status=success&orderId=xxx
 *   vuka://payment?status=failed&orderId=xxx
 *
 * This activity intercepts that, then opens the order tracking
 * page in the TWA so the customer sees the result immediately.
 */
class DeepLinkActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val uri: Uri? = intent?.data
        if (uri != null) {
            val status  = uri.getQueryParameter("status")  ?: "unknown"
            val orderId = uri.getQueryParameter("orderId") ?: ""

            // Build the web URL for the order tracking page
            val trackUrl = "https://vuka-deliver.vercel.app/order/$orderId"

            // Launch the TWA pointing at the order page
            val twaIntent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse(trackUrl)
            ).apply {
                setPackage(packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            startActivity(twaIntent)
        }

        finish()
    }
}
