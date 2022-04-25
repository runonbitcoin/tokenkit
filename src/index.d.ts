export type Class = { new(...args: any[]): any; };
export type RunCode = any;
export type RunJig = any;
export type RunLock = any;
export type RunInstance = any;
export type txid = string;

type MintArgs = any | Array<any>;

interface FTParams {
  className?: string;
  metadata: Partial<PresentationMetadata | LicenseMetadata>;
  symbol: string;
  decimals?: number;
  sealed?: boolean;
  transferable?: boolean;
  upgradable?: boolean;
  [key: string]: any;
}

interface NFTParams {
  className?: string;
  metadata: Partial<PresentationMetadata | LicenseMetadata>;
  maxSupply?: number;
  sealed?: boolean;
  transferable?: boolean;
  upgradable?: boolean;
  [key: string]: any;
}

interface PresentationMetadata {
  name: string;
  description: string;
  emoji: string;
  image: MediaReference;
  audio: MediaReference;
  video: MediaReference;
  glbModel: MediaReference;
  [key: string]: any;
}

interface LicenseMetadata {
  title: string;
  author: string;
  source: string;
  license: string;
  [key: string]: any;
}

type MediaReference = any;

interface OfferParams {
  jig?: RunJig;
  jigbox?: JigBox;
  amount?: number;
  address: string;
  satoshis: number;
}

export class JigBox {
  contract: RunCode;
  jigs: RunJig[];
  type: 'FT' | 'NFT';

  static fromClass(contract: RunCode, type: string): Promise<JigBox>;
  static fromOrigin(origin: string, type: string): Promise<JigBox>;

  get balance(): number;
  get balanceAsDecimal(): string;

  send(owner: string | RunLock, amount: number): Promise<txid>;
  sendMany(recipients: [string | RunLock, number][]): Promise<txid>;
  burn(amount: number): Promise<txid>;
  sync(): Promise<void>;
}

export interface TokenInterface {
  create(params: FTParams | NFTParams): Promise<Class>;
  deploy(params: FTParams | NFTParams | Class): Promise<RunCode>;
  upgrade(origin: string, params: FTParams | NFTParams | Class): Promise<RunCode>;
  mint(origin: string, recipients: MintArgs[]): Promise<txid>;
  getJigBox(origin: string): Promise<JigBox>;
}

export interface DexInterface {
  createOffer(params: OfferParams): Promise<RunJig>;
  listOffers(origin: string): Promise<RunJig[]>;
  takeOffer(location: string): Promise<txid>;
  cancelOffer(location: string): Promise<txid>;
}

export interface UtilInterface {
  upgradeClass(origin: string, newClass: Class, updated?: string[]): Promise<RunCode>
}

export const ft: TokenInterface;
export const nft: TokenInterface;
export const dex: DexInterface;
export const util: UtilInterface;
