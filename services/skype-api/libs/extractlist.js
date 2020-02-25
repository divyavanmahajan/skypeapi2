const HEADER_EXTRACT = [
  ['From', 'sip:user@unknown.com', 'VQSessionReport.0.DialogInfo.0.FromURI.0'],
  ['To', 'sip:user@unknown.com', 'VQSessionReport.0.DialogInfo.0.ToURI.0'],
  [
    'Start',
    '2018-01-01T00:00:00.0000Z',
    'VQSessionReport.0.DialogInfo.0.$.Start',
  ],
  ['End', '2018-01-01T00:00:00.0000Z', 'VQSessionReport.0.DialogInfo.0.$.End'],
  ['Endpoint', { placeholder: 'dummy' }, 'VQSessionReport.0.Endpoint.0.$'],
  ['MachineName', 'unknown', 'VQSessionReport.0.Endpoint.0.$.Name'],
  ['OS', 'unknown', 'VQSessionReport.0.Endpoint.0.$.v2:OS'],
  ['MachineInfo', 'unknown', 'VQSessionReport.0.Endpoint.0.$.v7:MachineInfo'],
  ['MediaLineType', 'unknown', 'VQSessionReport.0.MediaLine.0.$.Label'],
];
const MEDIALINE_EXTRACT = [
  // ['Description', {}, 'VQSessionReport.0.MediaLine.0.Description.0'],
  [
    'DelayRelativeOneWay',
    0,
    'VQSessionReport.0.MediaLine.0.InboundStream.0.Network.0.Delay.0.v3:RelativeOneWay.0.v3:Average.0',
  ],
  [
    'AverageJitterInMs',
    0,
    'VQSessionReport.0.MediaLine.0.InboundStream.0.Payload.0.Audio.0.v4:NetworkJitterAvg.0',
  ],
  [
    'PacketLossRate',
    0,
    'VQSessionReport.0.MediaLine.0.InboundStream.0.Network.0.PacketLoss.0.LossRate.0',
  ],
  [
    'PacketsReceived',
    0,
    'VQSessionReport.0.MediaLine.0.InboundStream.0.Network.0.Utilization.0.Packets.0',
  ],
  [
    'PacketReorderRatio',
    0,
    'VQSessionReport.0.MediaLine.0.InboundStream.0.Payload.0.Audio.0.v4:PacketReorderRatio.0',
  ],
  [
    'RoundTripLatencyInMs',
    0,
    'VQSessionReport.0.MediaLine.0.OutboundStream.0.Network.0.Delay.0.RoundTrip.0',
  ],
  [
    'PacketsSent',
    0,
    'VQSessionReport.0.MediaLine.0.OutboundStream.0.Network.0.Utilization.0.Packets.0',
  ],
  [
    'MidCall',
    false,
    'VQSessionReport.0.MediaLine.0.Description.0.v3:MidCallReport.0',
  ],
  [
    'LocalIPAddress',
    '0.0.0.0',
    'VQSessionReport.0.MediaLine.0.Description.0.LocalAddr.0.IPAddr.0',
  ],
  [
    'MAC',
    ' ',
    'VQSessionReport.0.MediaLine.0.Description.0.LocalAddr.0.v2:MACAddr.0',
  ],
  [
    'RemoteIPAddress',
    '0.0.0.0',
    'VQSessionReport.0.MediaLine.0.Description.0.RemoteAddr.0.IPAddr.0',
  ],
  [
    'RelayIPAddress',
    '0.0.0.0',
    'VQSessionReport.0.MediaLine.0.Description.0.Connectivity.0.RelayAddress.0.IPAddr.0',
  ],
  [
    'ReflexiveLocalIPAddress',
    '0.0.0.0',
    'VQSessionReport.0.MediaLine.0.Description.0.v3:ReflexiveLocalIPAddress.0.IPAddr.0',
  ],
  [
    'NetworkConnection',
    'unknown',
    'VQSessionReport.0.MediaLine.0.Description.0.NetworkConnectivityInfo.0.NetworkConnection.0',
  ],
  [
    'VPN',
    'false',
    'VQSessionReport.0.MediaLine.0.Description.0.NetworkConnectivityInfo.0.VPN.0',
  ],
  [
    'LinkSpeed',
    0,
    'VQSessionReport.0.MediaLine.0.Description.0.NetworkConnectivityInfo.0.LinkSpeed.0',
  ],
  [
    'BSSID',
    ' ',
    'VQSessionReport.0.MediaLine.0.Description.0.NetworkConnectivityInfo.0.v2:BSSID.0',
  ],
  ['SSID', ' ', 'VQSessionReport.0.MediaLine.0.Description.0.v4:SSID.0'],
  [
    'NetworkConnectionDetails',
    ' ',
    'VQSessionReport.0.MediaLine.0.Description.0.NetworkConnectivityInfo.0.v3:NetworkConnectionDetails.0',
  ],
  [
    'WifiDriverDeviceDesc',
    ' ',
    'VQSessionReport.0.MediaLine.0.Description.0.NetworkConnectivityInfo.0.v3:WifiDriverDeviceDesc.0',
  ],
  [
    'WifiDriverVersion',
    ' ',
    'VQSessionReport.0.MediaLine.0.Description.0.NetworkConnectivityInfo.0.v3:WifiDriverVersion.0',
  ],
  [
    'InboundNetworkMOS',
    0,
    'VQSessionReport.0.MediaLine.0.InboundStream.0.QualityEstimates.0.Audio.0.NetworkMOS.0.OverallAvg.0',
  ],
  [
    'RecvListenMOS',
    0,
    'VQSessionReport.0.MediaLine.0.InboundStream.0.QualityEstimates.0.Audio.0.RecvListenMOS.0',
  ],
  [
    'SendListenMOS',
    0,
    'VQSessionReport.0.MediaLine.0.OutboundStream.0.QualityEstimates.0.Audio.0.SendListenMOS.0',
  ],
  [
    'TraceRoute',
    [{ 'v3:Hop': ['0'], 'v3:IPAddress': ['Not captured'], 'v3:RTT': ['0'] }],
    'VQSessionReport.0.MediaLine.0.Description.0.NetworkConnectivityInfo.0.v3:TraceRoute',
  ],
];

export { HEADER_EXTRACT, MEDIALINE_EXTRACT };
