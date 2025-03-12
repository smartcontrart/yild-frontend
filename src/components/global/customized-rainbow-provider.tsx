import {
  RainbowKitProvider,
  darkTheme,
  lightTheme
} from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';

export function CustomizedRainbowProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <RainbowKitProvider modalSize='compact' theme={theme === "dark" ? darkTheme({
      borderRadius: 'small',
      fontStack: 'system'
    }) : lightTheme({
      borderRadius: 'small',
      fontStack: 'system'
    }) }>
      {children}
    </RainbowKitProvider>
  )
}