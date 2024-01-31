import React, {useMemo} from "react";
import useSwap from "@/app/[locale]/swap/hooks/useSwap";
import {
  useSwapAmountsStore,
  useSwapTokensStore,
  useTradeStore,
  useTransactionSettingsStore
} from "@/app/[locale]/swap/stores";
import Dialog from "@/components/atoms/Dialog";
import DialogHeader from "@/components/DialogHeader";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import {
  computeSlippageAdjustedAmounts,
  computeSlippageAdjustedAmountsOut, computeTradePriceBreakdown,
  ONE_BIPS
} from "@/app/[locale]/swap/components/functions";
import { Route, TradeType } from "@callisto-enterprise/soy-sdk";
import Svg from "@/components/atoms/Svg";
import { useConfirmSwapDialogStore } from "@/app/[locale]/swap/stores/confirm";
import DrawerDialog from "@/components/atoms/DrawerDialog";

function Path({ route }: { route: Route | undefined }) {
  return <div>
    {route
      ? <div className="flex items-center gap-1 text-14">
        {route.path.map((r, index) => {
          return <React.Fragment key={index}><span key={r.symbol}>
                {r.symbol}
              </span>
            {index !== route?.path.length - 1 && <Svg size={18} iconName="next"/>}</React.Fragment>;
        })}
      </div>
      : <span>—</span>}
  </div>;
}

export function formatBalanceToEight(balance: string) {
  if(!balance) {
    return "0.0";
  }

  return Number(balance).toFixed(8)
    .replace(
      /\.00000000/,
      ".0"
    );
}

export default function ConfirmSwapDialog() {
  const { handleSwap } = useSwap();
  const {tokenTo, tokenFrom} = useSwapTokensStore();
  const { amountInString, amountOutString} = useSwapAmountsStore();

  const { trade } = useTradeStore();

  const {priceImpactWithoutFee} = useMemo(() => computeTradePriceBreakdown(trade), [trade])
  // const route = useStore($swapRoute);

  const {isSwapConfirmDialogOpened, setSwapConfirmDialogOpened} = useConfirmSwapDialogStore();

  const { slippage } = useTransactionSettingsStore();

  const {priceIn} = useMemo(() => {
    const formattedPrice = trade?.executionPrice?.toSignificant(6);

    return {
      priceIn: formattedPrice
    }
  }, [trade]);

  const {priceOut} = useMemo(() => {
    const formattedPrice = trade?.executionPrice?.invert()?.toSignificant(6);

    return {
      priceOut: formattedPrice
    }
  }, [trade]);

  return <DrawerDialog isOpen={isSwapConfirmDialogOpened} setIsOpen={setSwapConfirmDialogOpened}>

    <DialogHeader handleClose={() => setSwapConfirmDialogOpened(false)} title="Confirm swap" />

    <div className="p-10 w-full xl:w-[480px]">
      <div className="grid grid-cols-2 gap-2.5 relative">
        <div className="bg-secondary-bg rounded-2 h-[104px] flex flex-col justify-center items-center gap-2.5">
          <div className="flex items-center gap-1 text-secondary-text">
            <img width={24} height={24} src={tokenFrom?.logoURI} alt={tokenFrom?.name} />
            {tokenFrom?.symbol}
          </div>
          <span className="text-20 font-bold">
            {(+amountInString).toLocaleString("en-US", {maximumFractionDigits: 6, minimumFractionDigits: 2})}
          </span>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-primary-bg w-10 h-10 z-[2] text-secondary-text">
          <Svg iconName="arrow-right" />
        </div>
        <div className="bg-secondary-bg rounded-2 h-[104px] flex flex-col justify-center items-center gap-2.5">
          <div className="flex items-center gap-1 text-secondary-text">
            <img width={24} height={24} src={tokenTo?.logoURI} alt={tokenTo?.name} />
            {tokenTo?.symbol}
          </div>
          <span className="text-20 font-bold">
            {(+amountOutString).toLocaleString("en-US", {maximumFractionDigits: 6, minimumFractionDigits: 2})}
          </span>
        </div>
      </div>

      <p className="my-5 text-secondary-text font-normal text-14 text-center">Output it estimated. You will receive at least {amountOutString} {tokenTo?.symbol} or the transaction will revert</p>

      <div className="flex flex-col gap-2.5 rounded-2 p-5 border border-primary-border mt-5">
        <div className="text-14 flex justify-between items-center text-secondary-text">
          <span>1 {tokenTo?.symbol} price</span>
          <span>{priceOut} {tokenFrom?.symbol}</span>
        </div>

        <div className="text-14 flex justify-between items-center text-secondary-text">
          <span>1 {tokenFrom?.symbol} price</span>
          <span>{priceIn} {tokenTo?.symbol}</span>
        </div>

        <div className="text-14 flex justify-between items-center text-secondary-text">
        <span>
          {trade?.tradeType === TradeType.EXACT_INPUT ? 'Minimum received' : 'Maximum sold'}
        </span>
          <span>
          {!trade && "—"}
            {trade?.tradeType === TradeType.EXACT_INPUT
              ? `${computeSlippageAdjustedAmounts(trade, slippage)} ${tokenTo?.symbol}`
              : `${computeSlippageAdjustedAmountsOut(trade || undefined, slippage)} ${tokenTo?.symbol}`
            }
        </span>
        </div>

        <div className="text-14 flex justify-between items-center text-secondary-text">
          <span>Price impact</span>
          {priceImpactWithoutFee ? (priceImpactWithoutFee.lessThan(ONE_BIPS) ? '< 0.01%' : `${priceImpactWithoutFee.toFixed(2)}%`) : '—'}
        </div>

        <div className="text-14 flex justify-between items-center text-secondary-text">
          <span>Route</span>
          <Path route={trade?.route} />
        </div>
      </div>
      <div className="flex items-center gap-2.5 mt-5">
        <PrimaryButton fullWidth variant="outlined" onClick={() => setSwapConfirmDialogOpened(false)}>Cancel</PrimaryButton>
        <PrimaryButton fullWidth onClick={handleSwap}>Swap</PrimaryButton>
      </div>
    </div>

  </DrawerDialog>;
}
