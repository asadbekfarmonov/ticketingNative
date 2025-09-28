import {RefObject} from 'react';
import {captureRef} from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function renderTicketToPdf(ref: RefObject<any>, fileName: string): Promise<string> {
  if (!ref.current) {
    throw new Error('Ticket view is not ready');
  }
  const base64 = await captureRef(ref, {
    format: 'png',
    result: 'base64',
    quality: 1,
  });
  const html = `
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text'; margin: 0; padding: 32px; }
          .ticket { display: flex; flex-direction: column; align-items: center; }
          img { width: 260px; height: 260px; object-fit: contain; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <img src="data:image/png;base64,${base64}" />
        </div>
      </body>
    </html>
  `;
  const {uri} = await Print.printToFileAsync({html, base64: false});
  return uri;
}

export async function shareFile(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(uri);
}
