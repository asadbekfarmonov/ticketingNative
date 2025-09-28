import Foundation
import AVFoundation
import SwiftUI
import UIKit

@MainActor
final class ScanViewModel: NSObject, ObservableObject, AVCaptureMetadataOutputObjectsDelegate {
    enum ScanState: Equatable {
        case idle
        case success(String, Date, String)
        case duplicate(String, Date)
        case invalid
    }

    @Published private(set) var state: ScanState = .idle
    @Published private(set) var recentScans: [ScanRecord] = []
    @Published var torchEnabled = false

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var qrService: QRCodeService?
    private var store: GuestStore?

    func configure(with store: GuestStore) async {
        self.store = store
        self.qrService = QRCodeService(store: store)
        setupSession()
    }

    func makePreviewLayer() -> AVCaptureVideoPreviewLayer? {
        previewLayer
    }

    func toggleTorch() {
        guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else { return }
        do {
            try device.lockForConfiguration()
            device.torchMode = torchEnabled ? .off : .on
            device.unlockForConfiguration()
            torchEnabled.toggle()
        } catch {
            print("Torch error: \(error)")
        }
    }

    private func setupSession() {
        let session = AVCaptureSession()
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else {
            return
        }
        session.addInput(input)
        let output = AVCaptureMetadataOutput()
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        output.metadataObjectTypes = [.qr]
        previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer?.videoGravity = .resizeAspectFill
        captureSession = session
        session.startRunning()
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              metadataObject.type == .qr,
              let string = metadataObject.stringValue,
              let service = qrService,
              let store = store else { return }

        Task {
            do {
                let guest = try await service.verify(string)
                if guest.entered {
                    state = .duplicate(guest.fullName, guest.enteredAt ?? Date())
                    addRecord(status: .duplicate, name: guest.fullName)
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                } else {
                    try await store.toggleEntered(id: guest.id, entered: true)
                    state = .success(guest.fullName, Date(), guest.ticketCode ?? "")
                    addRecord(status: .success, name: guest.fullName)
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                }
            } catch {
                state = .invalid
                addRecord(status: .invalid, name: nil)
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            }
        }
    }

    private func addRecord(status: ScanRecord.Status, name: String?) {
        let record = ScanRecord(status: status, name: name, timestamp: Date())
        recentScans.insert(record, at: 0)
        recentScans = Array(recentScans.prefix(20))
    }
}

struct ScanRecord: Identifiable {
    enum Status {
        case success
        case duplicate
        case invalid
    }

    let id = UUID()
    let status: Status
    let name: String?
    let timestamp: Date
}
