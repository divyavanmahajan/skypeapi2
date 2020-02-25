import { gql } from 'apollo-server-lambda';
const schema = gql`
  type Query {
    getValidDates(user: String, after: String): ValidDates
    getSessionsForUser(
      user: String
      startfrom: String
      searchByDate: Boolean
      limit: Int
      nextToken: TokenInput
    ): SessionConnection!
    downloadReports(
      format: String! # JSON or XML. Default is JSON
      PK: [String]
      SK: [String]
    ): [String]
  }
  type ValidDateItem {
    PK: String!
    SK: String!
    reportcount: Int
  }

  type ValidDates {
    Items: [ValidDateItem]
    Count: Int
    ScannedCount: Int
    ConsumedCapacity: ConsumedCapacity
    nextToken: Token
  }

  type Session {
    PK: String!
    SK: String!
    AverageJitterInMs: Float
    BSSID: String
    DelayRelativeOneWay: Float
    End: String
    FileID: String
    From: String
    Hash: String
    InboundNetworkMOS: Float
    LinkSpeed: String
    LocalIPAddress: String
    MAC: String
    MachineInfo: String
    MachineName: String
    MediaLineType: String
    MidCall: String
    NetworkConnection: String
    OS: String
    PacketLossRate: Float
    PacketReorderRatio: Float
    PacketsReceived: Int
    PacketsSent: Int
    RecvListenMOS: Float
    ReflexiveLocalIPAddress: String
    RelayIPAddress: String
    RemoteIPAddress: String
    RoundTripLatencyInMs: Int
    SendListenMOS: Float
    SSID: String
    Start: String
    To: String
    VPN: String
    WifiDriverDeviceDesc: String
    WifiDriverVersion: String
  }
  type ConsumedCapacity {
    TableName: String
    CapacityUnits: Float
    Table: ConsumedCapacityTable
  }
  type ConsumedCapacityTable {
    CapacityUnits: Float
  }

  type SessionConnection {
    Items: [Session!]!
    Count: Int
    ScannedCount: Int
    ConsumedCapacity: ConsumedCapacity
    nextToken: Token
  }

  input TokenInput {
    PK: String
    SK: String
  }
  type Token {
    PK: String!
    SK: String!
  }
  schema {
    query: Query
    # mutation: Mutation
    # subscription: Subscription
  }
`;

export { schema };
