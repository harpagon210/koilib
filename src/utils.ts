import * as multibase from "multibase";
import { sha256 } from "@noble/hashes/lib/sha256";
import { ripemd160 } from "@noble/hashes/lib/ripemd160";
import krc20ProtoJson from "./jsonDescriptors/krc20-proto.json";
import protocolJson from "./jsonDescriptors/protocol-proto.json";
import { Abi } from "./interface";

/**
 * Converts an hex string to Uint8Array
 */
export function toUint8Array(hex: string): Uint8Array {
  const pairs = hex.match(/[\dA-F]{2}/gi);
  if (!pairs) throw new Error("Invalid hex");
  return new Uint8Array(
    pairs.map((s) => parseInt(s, 16)) // convert to integers
  );
}

/**
 * Converts Uint8Array to hex string
 */
export function toHexString(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((n) => `0${Number(n).toString(16)}`.slice(-2))
    .join("");
}

/**
 * Encodes an Uint8Array in base58
 */
export function encodeBase58(buffer: Uint8Array): string {
  return new TextDecoder().decode(multibase.encode("z", buffer)).slice(1);
}

/**
 * Decodes a buffer formatted in base58
 */
export function decodeBase58(bs58: string): Uint8Array {
  return multibase.decode(`z${bs58}`);
}

/**
 * Encodes an Uint8Array in base64
 */
export function encodeBase64(buffer: Uint8Array): string {
  return new TextDecoder().decode(multibase.encode("U", buffer)).slice(1);
}

/**
 * Decodes a buffer formatted in base64
 */
export function decodeBase64(bs64: string): Uint8Array {
  return multibase.decode(`U${bs64}`);
}

/**
 * Encodes a public or private key in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
export function bitcoinEncode(
  buffer: Uint8Array,
  type: "public" | "private",
  compressed = false
): string {
  let bufferCheck;
  let prefixBuffer;
  let offsetChecksum;
  if (type === "public") {
    bufferCheck = new Uint8Array(25);
    prefixBuffer = new Uint8Array(21);
    bufferCheck[0] = 0;
    prefixBuffer[0] = 0;
    offsetChecksum = 21;
  } else {
    if (compressed) {
      bufferCheck = new Uint8Array(38);
      prefixBuffer = new Uint8Array(34);
      offsetChecksum = 34;
      bufferCheck[33] = 1;
      prefixBuffer[33] = 1;
    } else {
      bufferCheck = new Uint8Array(37);
      prefixBuffer = new Uint8Array(33);
      offsetChecksum = 33;
    }
    bufferCheck[0] = 128;
    prefixBuffer[0] = 128;
  }
  prefixBuffer.set(buffer, 1);
  const firstHash = sha256(prefixBuffer);
  const doubleHash = sha256(firstHash);
  const checksum = new Uint8Array(4);
  checksum.set(doubleHash.slice(0, 4));
  bufferCheck.set(buffer, 1);
  bufferCheck.set(checksum, offsetChecksum);
  return encodeBase58(bufferCheck);
}

/**
 * Decodes a public or private key formatted in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
export function bitcoinDecode(value: string): Uint8Array {
  const buffer = decodeBase58(value);
  const privateKey = new Uint8Array(32);
  const checksum = new Uint8Array(4);
  // const prefix = buffer[0];
  privateKey.set(buffer.slice(1, 33));
  if (value[0] !== "5") {
    // compressed
    checksum.set(buffer.slice(34, 38));
  } else {
    checksum.set(buffer.slice(33, 37));
  }
  // TODO: verify prefix and checksum
  return privateKey;
}

/**
 * Computes a bitcoin address, which is the format used in Koinos
 *
 * address = bitcoinEncode( ripemd160 ( sha256 ( publicKey ) ) )
 */
export function bitcoinAddress(publicKey: Uint8Array): string {
  const hash = sha256(publicKey);
  const hash160 = ripemd160(hash);
  return bitcoinEncode(hash160, "public");
}

/**
 * Function to format a number in a decimal point number
 * @example
 * ```js
 * const amount = formatUnits("123456", 8);
 * console.log(amount);
 * // '0.00123456'
 * ```
 */
export function formatUnits(
  value: string | number | bigint,
  decimals: number
): string {
  let v = typeof value === "string" ? value : BigInt(value).toString();
  const sign = v[0] === "-" ? "-" : "";
  v = v.replace("-", "").padStart(decimals + 1, "0");
  const integerPart = v
    .substring(0, v.length - decimals)
    .replace(/^0+(?=\d)/, "");
  const decimalPart = v.substring(v.length - decimals);
  return `${sign}${integerPart}.${decimalPart}`.replace(/(\.0+)?(0+)$/, "");
}

/**
 * Function to format a decimal point number in an integer
 * @example
 * ```js
 * const amount = parseUnits("0.00123456", 8);
 * console.log(amount);
 * // '123456'
 * ```
 */
export function parseUnits(value: string, decimals: number): string {
  const sign = value[0] === "-" ? "-" : "";
  // eslint-disable-next-line prefer-const
  let [integerPart, decimalPart] = value
    .replace("-", "")
    .replace(",", ".")
    .split(".");
  if (!decimalPart) decimalPart = "";
  decimalPart = decimalPart.padEnd(decimals, "0");
  return `${sign}${`${integerPart}${decimalPart}`.replace(/^0+(?=\d)/, "")}`;
}

/**
 * ABI for tokens
 */
export const Krc20Abi: Abi = {
  methods: {
    name: {
      entryPoint: 0x76ea4297,
      input: "name_arguments",
      output: "name_result",
      readOnly: true,
    },
    symbol: {
      entryPoint: 0x7e794b24,
      input: "symbol_arguments",
      output: "symbol_result",
      readOnly: true,
    },
    decimals: {
      entryPoint: 0x59dc15ce,
      input: "decimals_arguments",
      output: "decimals_result",
      readOnly: true,
    },
    totalSupply: {
      entryPoint: 0xcf2e8212,
      input: "total_supply_arguments",
      output: "total_supply_result",
      readOnly: true,
    },
    balanceOf: {
      entryPoint: 0x15619248,
      input: "balance_of_arguments",
      output: "balance_of_result",
      readOnly: true,
      defaultOutput: { value: "0" },
    },
    transfer: {
      entryPoint: 0x62efa292,
      input: "transfer_arguments",
      output: "transfer_result",
    },
    mint: {
      entryPoint: 0xc2f82bdc,
      input: "mint_argumnets",
      output: "mint_result",
    },
  },
  types: krc20ProtoJson,
};

export const ProtocolTypes = protocolJson;
