package com.polarh7rr;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;

import java.util.Arrays;
import java.util.List;

import it.innove.BleManagerPackage;
import cl.json.RNSharePackage;
import com.rnfs.RNFSPackage;
import org.pgsqlite.SQLitePluginPackage;
import io.neson.react.notification.NotificationPackage;
import co.apptailor.Worker.WorkerPackage;
public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    protected boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
          new BleManagerPackage(),
          new RNSharePackage(),
          new RNFSPackage(),
          // new SQLitePluginPackage(),
          // new NotificationPackage(),
          new WorkerPackage(
            new BleManagerPackage(),
            new NotificationPackage(),
            new RNFSPackage()
          )
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
      return mReactNativeHost;
  }
}
