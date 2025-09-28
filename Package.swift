// swift-tools-version: 5.9
import PackageDescription
import AppleProductTypes

let package = Package(
    name: "GuestList",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .iOSApplication(
            name: "GuestList",
            targets: ["AppModule"],
            bundleIdentifier: "com.example.GuestList",
            teamIdentifier: "ABCDE12345",
            displayVersion: "1.0",
            bundleVersion: "1",
            appIcon: .placeholder,
            accentColor: .presetColor(.blue),
            supportedDeviceFamilies: [
                .phone
            ],
            supportedInterfaceOrientations: [
                .portrait,
                .portraitUpsideDown
            ],
            capabilities: [
                .camera(purposeString: "Camera access is needed to scan tickets."),
                .fileAccess(.userSelectedFiles, mode: .readOnly)
            ]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/CoreOffice/CoreXLSX.git", from: "0.17.0")
    ],
    targets: [
        .executableTarget(
            name: "AppModule",
            dependencies: [
                .product(name: "CoreXLSX", package: "CoreXLSX")
            ],
            path: "Sources"
        )
    ]
)
