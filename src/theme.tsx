import { MantineThemeOverride } from '@mantine/core';

const theme: MantineThemeOverride = {
	colorScheme: 'dark',
	primaryColor: 'red',
	components: {
		Text: {
			defaultProps: {
				color: 'white',
			},
		},
	},
	globalStyles: (theme) => ({
		body: {
			background:
				theme.colorScheme === 'dark'
					? theme.fn.radialGradient(theme.colors.dark[9], theme.colors.dark[8])
					: theme.white,
			color: 'white',
		},
	}),
};

export default theme;
