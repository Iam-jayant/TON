'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEADMAN_THRESHOLDS } from "@/lib/constants";
import { NomineeInput, VaultSnapshot, api } from "@/lib/api";
import { useTelegramMiniApp } from "@/lib/telegram";
import { TonProvider, TonWalletButton, useTon } from "@/lib/ton";
import { formatDistanceToNowStrict } from "date-fns";
import { Activity, BellRing, Shield, UserPlus } from "lucide-react";
import clsx from "clsx";

const emptyNominee: NomineeInput = {
  fullName: "",
  email: "",
  tonWallet: "",
  share: 0,
};

export function InheritorApp() {
  return (
    <TonProvider>
      <MainDashboard />
    </TonProvider>
  );
}

function MainDashboard() {
  const telegram = useTelegramMiniApp();
  const { tonAddress } = useTon();
  const [inactivityDays, setInactivityDays] = useState(30);
  const [nominees, setNominees] = useState<NomineeInput[]>([
    { ...emptyNominee, share: 100 },
  ]);
  const [status, setStatus] = useState<VaultSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!tonAddress) return;
    api
      .fetchVault(tonAddress)
      .then(setStatus)
      .catch(() => null);
  }, [tonAddress]);

  const activitySummary = useMemo(() => {
    if (!status?.lastPingAt) return "No pings yet";
    return `Last ping ${formatDistanceToNowStrict(new Date(status.lastPingAt))} ago`;
  }, [status]);

  const handleNomineeChange = (
    index: number,
    field: keyof NomineeInput,
    value: string,
  ) => {
    setNominees((prev) =>
      prev.map((nominee, i) =>
        i === index
          ? {
              ...nominee,
              [field]:
                field === "share" ? Number(value) : value,
            }
          : nominee,
      ),
    );
  };

  const addNominee = () =>
    setNominees((prev) => [...prev, emptyNominee]);

  const totalShare = nominees.reduce((sum, nominee) => sum + Number(nominee.share || 0), 0);

  const emailRegex = /\S+@\S+\.\S+/;

  const nomineeValidity = nominees.map((nominee) => ({
    fullName: nominee.fullName.trim().length >= 3,
    email: emailRegex.test(nominee.email.trim()),
    tonWallet: nominee.tonWallet.trim().length >= 10,
    share: Number(nominee.share) > 0,
  }));

  const formHasGaps = nomineeValidity.some((valid) =>
    Object.values(valid).some((isValid) => !isValid),
  );

  const canSave =
    Boolean(tonAddress) && !formHasGaps && totalShare === 100 && !loading;

  const submitVault = useCallback(async () => {
    setShowValidation(true);
    if (!tonAddress) {
      setError("Connect TON wallet first.");
      return;
    }
    if (formHasGaps) {
      setError("Complete nominee details with valid information.");
      return;
    }
    if (totalShare !== 100) {
      setError("Nominee share must total 100%.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ownerTonAddress: tonAddress,
        inactivityDays,
        nominees,
        backupEmail: telegram?.initData?.user?.username ?? undefined,
      };
      const { vaultId } = await api.createVault(payload);
      const fresh = await api.fetchVault(tonAddress);
      setStatus(fresh);
      setToast(`Vault ${vaultId} saved`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tonAddress, inactivityDays, nominees, totalShare, telegram, formHasGaps]);

  const sendPing = async () => {
    if (!tonAddress) return;
    try {
      const proof = `${tonAddress}-${Date.now()}`;
      await api.sendPing(tonAddress, proof);
      const updated = await api.fetchVault(tonAddress);
      setStatus(updated);
      setToast("Deadman switch ping recorded.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="glass-panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Inheritor • TON Deadman Switch
            </p>
            <h1 className="text-3xl font-semibold">Protect your TON family legacy</h1>
            <p className="text-sm text-white/60">
              Auto-liquidate your entire TON balance into USDC + Razorpay payouts whenever inactivity crosses your chosen threshold.
            </p>
          </div>
          <TonWalletButton />
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <div className="flex items-center gap-2 text-white/70">
            <Shield size={18} className="text-ton-accent" />
            Deadman switch configuration
          </div>
          <div className="mt-4 space-y-4">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Inactivity threshold
              <div className="grid grid-cols-2 gap-2">
                {DEADMAN_THRESHOLDS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInactivityDays(value)}
                    className={clsx(
                      "rounded-xl border px-3 py-2 text-left text-base transition",
                      value === inactivityDays
                        ? "border-ton-primary bg-ton-primary/10 text-white"
                        : "border-white/10 text-white/70 hover:border-ton-primary/50",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </label>

            <div className="rounded-2xl border border-white/10 p-4 text-sm text-white/70">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Activity size={16} />
                {status ? status.status : "No vault yet"}
              </div>
              <p className="text-white/60">{activitySummary}</p>
              <p className="text-xs text-white/50">
                Pings are recorded via TON wallet sign-ins and Telegram session heartbeats.
              </p>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <div className="flex items-center gap-2 text-white/70">
            <BellRing size={18} className="text-ton-accent" />
            Instant alerts
          </div>
          <ul className="mt-4 list-disc space-y-3 pl-4 text-sm text-white/70">
            <li>Nominees receive email + Telegram alerts at registration and on inactivity warnings.</li>
            <li>Backend oracle monitors chain + off-chain to auto declare inactivity.</li>
            <li>Razorpay payouts are reconciled after TON→USDC swap.</li>
          </ul>
          <button
            onClick={sendPing}
            disabled={!tonAddress}
            className="mt-6 w-full rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send manual ping
          </button>
        </Card>
      </section>

      <Card>
        <div className="flex items-center justify-between text-white/80">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-ton-accent" />
            Nominee distribution
          </div>
          <span className={clsx("text-sm", totalShare === 100 ? "text-emerald-400" : "text-rose-400")}>
            {totalShare}% allocated
          </span>
        </div>
        <div className="mt-4 space-y-4">
          {nominees.map((nominee, index) => {
            const validity = nomineeValidity[index];
            const showErrors = showValidation;
            return (
              <div key={index} className="rounded-2xl border border-white/10 p-4 text-sm lg:grid lg:grid-cols-4 lg:gap-4">
              <input
                className={clsx(
                  "input",
                  showErrors && !validity.fullName && "border-rose-400/70",
                )}
                placeholder="Full name"
                value={nominee.fullName}
                onChange={(e) => handleNomineeChange(index, "fullName", e.target.value)}
              />
              <input
                className={clsx(
                  "input",
                  showErrors && !validity.email && "border-rose-400/70",
                )}
                placeholder="Email"
                value={nominee.email}
                onChange={(e) => handleNomineeChange(index, "email", e.target.value)}
              />
              <input
                className={clsx(
                  "input",
                  showErrors && !validity.tonWallet && "border-rose-400/70",
                )}
                placeholder="TON wallet"
                value={nominee.tonWallet}
                onChange={(e) => handleNomineeChange(index, "tonWallet", e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  className={clsx(
                    "input",
                    showErrors && !validity.share && "border-rose-400/70",
                  )}
                  placeholder="Share %"
                  type="number"
                  value={nominee.share}
                  onChange={(e) => handleNomineeChange(index, "share", e.target.value)}
                />
                <span className="text-white/40">%</span>
              </div>
            </div>
          )})}
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-white/50">
            Payouts auto-trigger the moment the deadman switch fires—no extra KYC or form fills for nominees.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addNominee}
              className="rounded-2xl border border-dashed border-white/20 px-4 py-2 text-sm text-white/70 hover:border-ton-primary hover:text-white"
            >
              + add nominee
            </button>
            <button
              onClick={submitVault}
              disabled={!canSave}
              className="rounded-2xl bg-ton-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-ton-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save policy"}
            </button>
          </div>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          {!tonAddress && (
            <p className="text-amber-300/80">Connect your TON wallet to enable saving.</p>
          )}
          {totalShare !== 100 && (
            <p className="text-rose-400">Distribution must equal 100% (currently {totalShare}%).</p>
          )}
          {showValidation && formHasGaps && (
            <p className="text-rose-300">Fill every nominee field with valid info.</p>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        {toast && <p className="mt-2 text-sm text-emerald-400">{toast}</p>}
      </Card>

      <Card>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Liquidation timeline
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            "Owner inactivity threshold hits; oracle sweep pulls the entire TON wallet balance.",
            "Backend swaps TON→USDC instantly and routes to Razorpay treasury.",
            "Nominees receive their exact share with an email + Telegram alert—nothing else required.",
          ].map((step, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 p-4 text-sm text-white/70">
              <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                {idx + 1}
              </span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "glass-panel p-6 shadow-2xl shadow-ton-primary/5",
        className,
      )}
    >
      {children}
    </section>
  );
}

