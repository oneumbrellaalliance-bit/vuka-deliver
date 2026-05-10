package rw.vuka.deliver

import android.app.Application

class Application : Application() {
    override fun onCreate() {
        super.onCreate()
        // Nothing extra needed — TWA handles everything
    }
}
