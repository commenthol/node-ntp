// TypeScript Version: 3.3

/// <reference types="node" />

declare module 'ntp2' {
  import { AddressInfo } from "net";

  export interface NtpOptions {
    server?: string;
    port?: number;
  }

  export enum NtpPacketModes {
    CLIENT = 3,
    SERVER = 4
  }

  export interface NtpPacket {
    leapIndicator: number;
    version: number;
    mode: number;
    stratum: number;
    pollInterval: number;
    precision: number;
    rootDelay: number;
    rootDispersion: number;
    referenceIdentifier: string | Buffer;
    referenceTimestamp: number;
    originateTimestamp: number;
    receiveTimestamp: number;
    transmitTimestamp: number;
    keyIdentifier: string | undefined;
    messageDigest: string | undefined;
    destinationTimestamp?: number;
    pollIntervalSecs?: number;
    time?: Date;
    roundTripDelay?: number;
    systemClockOffset?: number;
    toBuffer: () => Buffer;
    toJSON: () => object;
    withDestinationTime: () => NtpPacket;
    MODES: NtpPacketModes;
  }

  export interface NtpServerOptions {
    port?: number;
    stratum?: number;
    referenceIdentifier?: string | Buffer;
  }

  class NtpServer {
    constructor(options?: NtpServerOptions, onRequest?: (packet: NtpPacket, callback: (packet: NtpPacket) => void) => void);
    constructor(onRequest?: (packet: NtpPacket, callback: (packet: NtpPacket) => void) => void);
    listen(port?: number, address?: string, callback?: (err: Error | null, ...args: any[]) => void): void;
    close(callback?: (err: Error | null) => void): NtpServer;
    address(): AddressInfo;
    parse(message: Buffer, rinfo: any): NtpServer;
    send(rinfo: any, message: Buffer | NtpPacket, callback?: (err: Error | null) => void): NtpServer;
  }

  class Ntp {
    constructor(options?: NtpOptions, callback?: (err: Error | null, packet: NtpPacket) => void);
    constructor(callback?: (err: Error | null, packet: NtpPacket) => void);
    time(callback?: (err: Error | null, packet: NtpPacket) => void): Ntp;
    static createPacket(): void;
    static parse(buffer: Buffer): NtpPacket;
    static createServer(options?: NtpServerOptions): NtpServer;
  }
}
