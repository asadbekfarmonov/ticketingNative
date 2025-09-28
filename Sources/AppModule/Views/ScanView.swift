import SwiftUI
import AVFoundation

struct ScanView: View {
    @EnvironmentObject private var viewModel: ScanViewModel

    var body: some View {
        ZStack(alignment: .top) {
            CameraPreview(layer: viewModel.makePreviewLayer())
                .ignoresSafeArea()
            VStack {
                header
                Spacer()
                statusBanner
                historyList
            }
            .padding(16)
        }
        .onAppear {
            AVCaptureDevice.requestAccess(for: .video) { _ in }
        }
    }

    private var header: some View {
        HStack {
            Text("Scan Tickets")
                .font(.largeTitle)
                .bold()
                .foregroundColor(.white)
            Spacer()
            Button(action: { viewModel.toggleTorch() }) {
                Image(systemName: viewModel.torchEnabled ? "bolt.fill" : "bolt.slash.fill")
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Color.black.opacity(0.4))
                    .clipShape(Circle())
            }
        }
    }

    private var statusBanner: some View {
        Group {
            switch viewModel.state {
            case .idle:
                EmptyView()
            case .success(let name, let time, let code):
                ScanResultCard(icon: "checkmark.seal", color: Color(hex: "2E7D32"), title: "Admitted", subtitle: name, detail: DateFormatter.timeFormatter.string(from: time) + " • #" + code)
            case .duplicate(let name, let time):
                ScanResultCard(icon: "exclamationmark.triangle", color: Color(hex: "F9A825"), title: "Already checked in", subtitle: name, detail: DateFormatter.timeFormatter.string(from: time))
            case .invalid:
                ScanResultCard(icon: "xmark.octagon", color: Color(hex: "C62828"), title: "Invalid or tampered ticket", subtitle: "", detail: nil)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var historyList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recent Scans")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
            ForEach(viewModel.recentScans) { record in
                ScanHistoryRow(record: record)
            }
        }
        .padding()
        .background(Color.black.opacity(0.4))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct CameraPreview: UIViewRepresentable {
    let layer: AVCaptureVideoPreviewLayer?

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        if let layer = layer {
            layer.frame = UIScreen.main.bounds
            view.layer.addSublayer(layer)
        }
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        layer?.frame = uiView.bounds
    }
}

struct ScanResultCard: View {
    let icon: String
    let color: Color
    let title: String
    let subtitle: String
    let detail: String?

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.white)
                .padding(12)
                .background(color)
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                if !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.subheadline)
                }
                if let detail {
                    Text(detail)
                        .font(.footnote)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground).opacity(0.9))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct ScanHistoryRow: View {
    let record: ScanRecord

    var body: some View {
        HStack {
            Circle()
                .fill(color(for: record.status))
                .frame(width: 12, height: 12)
            Text(record.name ?? "Unknown")
                .foregroundColor(.white)
            Spacer()
            Text(DateFormatter.timeFormatter.string(from: record.timestamp))
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
        }
    }

    private func color(for status: ScanRecord.Status) -> Color {
        switch status {
        case .success: return Color(hex: "2E7D32")
        case .duplicate: return Color(hex: "F9A825")
        case .invalid: return Color(hex: "C62828")
        }
    }
}

private extension DateFormatter {
    static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.timeStyle = .medium
        return formatter
    }()
}
