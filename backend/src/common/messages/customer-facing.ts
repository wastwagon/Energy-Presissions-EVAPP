/** Customer-facing API error copy (also mapped on the frontend). */
export const CustomerErrors = {
  insufficientWallet:
    'Your wallet balance is too low. Top up your wallet to continue.',
  insufficientWalletToStart: (minGhs: number) =>
    `Add at least GHS ${minGhs} to your wallet before you can start charging.`,
  failedToStartCharging:
    'We could not start charging. Make sure your vehicle is plugged in and try again.',
  chargerOffline:
    'This charger is offline right now. Try another station or check back in a few minutes.',
  chargerOfflineStale:
    'This charger was online recently but is not responding. Wait a minute and try again, or choose another station.',
  chargerNotConnected:
    'This charger is not connected to the network. Try another station or contact the site operator.',
  remoteStartRejected:
    'The charger could not start your session. Plug the cable into your vehicle firmly, then try again.',
  remoteStartNotAccepted: (status: string) =>
    status
      ? `The charger did not accept the start request (${status}). Plug in your vehicle and try again.`
      : 'The charger did not accept the start request. Plug in your vehicle and try again.',
  connectorNotReady: (connectorId: number, status: string) =>
    `Connector ${connectorId} is ${status.toLowerCase()}. Wait until it shows Available, or try another connector.`,
  commandTimeout:
    'The charger did not respond in time. Check that it is powered on and online, then try again.',
  commandFailed: 'Something went wrong talking to the charger. Please try again in a moment.',
  stopFailed: 'We could not stop charging remotely. You can also unplug the cable to end the session.',
} as const;
