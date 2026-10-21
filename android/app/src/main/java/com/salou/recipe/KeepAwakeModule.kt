package com.salou.recipe

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Keeps the screen on while a recipe is open (hands busy in the kitchen).
 * Only affects this app's window: Android goes back to its normal sleep
 * timeout as soon as the flag is cleared or the app is left.
 */
class KeepAwakeModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

  override fun getName() = NAME

  @ReactMethod
  fun activate() = updateWindow { it.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }

  @ReactMethod
  fun deactivate() = updateWindow { it.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }

  private fun updateWindow(change: (android.view.Window) -> Unit) {
    val activity = reactApplicationContext.currentActivity ?: return
    // Window flags can only be changed from the UI thread.
    activity.runOnUiThread { change(activity.window) }
  }

  companion object {
    const val NAME = "KeepAwake"
  }
}
