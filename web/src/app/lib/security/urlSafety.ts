import "server-only";

import { lookup } from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);
const BLOCKED_SUFFIXES = [".local", ".localhost"];
const METADATA_IP = "169.254.169.254";

const DNS_CACHE: Map<string, { expiresAt: number; ips: string[] }> =
  // eslint-disable-next-line no-var
  (globalThis as any).__als_dns_cache || new Map();
// eslint-disable-next-line no-var
(globalThis as any).__als_dns_cache = DNS_CACHE;
const DNS_CACHE_TTL_MS = 60_000;

export type UrlSafetyResult = { url: URL; ips: string[] };

function normalizeUrl(input: string | URL): URL {
  const raw = typeof input === "string" ? String(input || "").trim() : input.toString();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("invalid_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("invalid_scheme");
  }

  if (!url.hostname) {
    throw new Error("invalid_hostname");
  }

  return url;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return (((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0) >>> 0;
}

function inCidr(ip: string, base: string, maskBits: number) {
  const ipNum = ipv4ToInt(ip);
  const baseNum = ipv4ToInt(base);
  if (ipNum === null || baseNum === null) return false;
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipNum & mask) === (baseNum & mask);
}

function isPrivateIpv4(ip: string) {
  if (ip === METADATA_IP) return true;
  return (
    inCidr(ip, "0.0.0.0", 8) || // "this" network
    inCidr(ip, "10.0.0.0", 8) ||
    inCidr(ip, "127.0.0.0", 8) || // loopback
    inCidr(ip, "169.254.0.0", 16) || // link-local
    inCidr(ip, "172.16.0.0", 12) ||
    inCidr(ip, "192.168.0.0", 16) ||
    inCidr(ip, "100.64.0.0", 10) || // carrier-grade NAT
    inCidr(ip, "224.0.0.0", 4) // multicast
  );
}

function isPrivateIpv6(ip: string) {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
  if (lower === "::1") return true;
  if (lower.startsWith("ff")) return true; // multicast ff00::/8
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true; // link-local fe80::/10
  }
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local fc00::/7

  if (lower.includes(".")) {
    const tail = lower.split(":").pop() || "";
    if (net.isIP(tail) === 4) return isPrivateIpv4(tail);
  }

  return false;
}

function isBlockedHostname(hostname: string) {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  return BLOCKED_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

function isPublicIp(ip: string) {
  const family = net.isIP(ip);
  if (family === 4) return !isPrivateIpv4(ip);
  if (family === 6) return !isPrivateIpv6(ip);
  return false;
}

async function resolveIps(hostname: string) {
  const cached = DNS_CACHE.get(hostname);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.ips;

  const results = await lookup(hostname, { all: true, verbatim: true });
  const ips = results.map((r) => r.address).filter(Boolean);
  DNS_CACHE.set(hostname, { ips, expiresAt: now + DNS_CACHE_TTL_MS });
  return ips;
}

export async function assertPublicHttpUrl(input: string | URL): Promise<UrlSafetyResult> {
  const url = normalizeUrl(input);
  const hostname = url.hostname;

  if (isBlockedHostname(hostname)) {
    throw new Error("blocked_hostname");
  }

  const isIpLiteral = net.isIP(hostname) !== 0;
  const ips = isIpLiteral ? [hostname] : await resolveIps(hostname);

  if (!ips.length) {
    throw new Error("dns_unresolved");
  }

  for (const ip of ips) {
    if (!isPublicIp(ip)) {
      throw new Error("blocked_ip");
    }
  }

  return { url, ips };
}

export async function fetchWithSafety(
  input: string | URL,
  init: RequestInit & { maxRedirects?: number } = {}
) {
  const { maxRedirects: maxRedirectsRaw, ...fetchInit } = init;
  const maxRedirects = Math.max(0, Math.min(5, Number(maxRedirectsRaw ?? 3)));
  let current = input;

  for (let i = 0; i <= maxRedirects; i += 1) {
    const { url } = await assertPublicHttpUrl(current);
    const res = await fetch(url.toString(), { ...fetchInit, redirect: "manual" });
    const status = res.status;
    const location = res.headers.get("location");
    if (status >= 300 && status < 400 && location) {
      if (i === maxRedirects) throw new Error("redirect_limit");
      const nextUrl = new URL(location, url);
      current = nextUrl.toString();
      continue;
    }
    return res;
  }

  throw new Error("redirect_limit");
}
