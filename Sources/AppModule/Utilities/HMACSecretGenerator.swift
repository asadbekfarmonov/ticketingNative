import Foundation
import CryptoKit

enum HMACSecretGenerator {
    static func generate() -> Data {
        let keyData = SymmetricKey(size: .bits256)
        return keyData.withUnsafeBytes { Data($0) }
    }
}
