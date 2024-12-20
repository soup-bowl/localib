import React from "react"

export const DonateButton: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
	<a href="https://www.buymeacoffee.com/soupbowl" style={style}>
		<img src="/bmac.webp" alt="Donate" style={{ maxWidth: 180 }} />
	</a>
)
