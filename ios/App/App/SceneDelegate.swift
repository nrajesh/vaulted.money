import UIKit
import Capacitor

/// Scene lifecycle (required for apps built with the iOS 27 SDK / Xcode 27;
/// an app still on the old AppDelegate-only lifecycle will not launch).
///
/// `Main.storyboard` (named in Info.plist's scene manifest) normally creates
/// the window and the Capacitor web view. The fallback below builds them in
/// code if the storyboard did not. URL opens and universal links are passed
/// to Capacitor's proxy so plugins keep receiving them.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        if window == nil, let windowScene = scene as? UIWindowScene {
            let window = UIWindow(windowScene: windowScene)
            window.rootViewController = CAPBridgeViewController()
            window.makeKeyAndVisible()
            self.window = window
        }
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
