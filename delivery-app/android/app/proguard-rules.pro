# TWA / Chrome Custom Tabs
-keep class com.google.androidbrowserhelper.** { *; }
-keep class androidx.browser.** { *; }

# Keep our own classes
-keep class rw.vuka.deliver.** { *; }

# Standard Android
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
