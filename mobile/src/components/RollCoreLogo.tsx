import Svg, { Path, Polygon } from 'react-native-svg';

type Props = { size?: number; color?: string };

export function RollCoreLogo({ size = 72, color = '#70B596' }: Props) {
  const width = size * (56.14 / 65.07);
  return (
    <Svg width={width} height={size} viewBox="0 0 56.14 65.07" fill="none"
         stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <Polygon points="28.07,1.83 54.32,17.18 54.32,47.89 28.07,63.24 1.83,47.89 1.83,17.18" strokeWidth={3.65} />
      <Path
        d="M1.83 17.18 L54.32 17.18 M1.83 44.88 L54.32 44.88 M3.63 17.18 L15.89 44.88 M15.89 44.88 L28.07 17.18 M28.07 17.18 L40.25 44.88 M40.25 44.88 L52.51 17.18 M15.89 44.88 L28.07 59.48 M40.25 44.88 L28.07 59.48"
        strokeWidth={1.65}
      />
    </Svg>
  );
}