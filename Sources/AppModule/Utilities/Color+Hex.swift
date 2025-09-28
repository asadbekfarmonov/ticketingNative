import SwiftUI

extension Color {
    init(hex: String) {
        var string = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        if string.count == 6 {
            string = "FF" + string
        }
        var value: UInt64 = 0
        Scanner(string: string).scanHexInt64(&value)
        let a = Double((value & 0xFF000000) >> 24) / 255.0
        let r = Double((value & 0x00FF0000) >> 16) / 255.0
        let g = Double((value & 0x0000FF00) >> 8) / 255.0
        let b = Double(value & 0x000000FF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}
