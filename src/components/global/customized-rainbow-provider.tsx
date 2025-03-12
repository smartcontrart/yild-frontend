import {
  RainbowKitProvider,
  darkTheme,
  lightTheme
} from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';

export function CustomizedRainbowProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <RainbowKitProvider modalSize='compact' theme={theme === "light" ? lightTheme() : darkTheme() }>
      {children}
    </RainbowKitProvider>
  )
}