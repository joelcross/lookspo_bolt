import type { Meta, StoryObj } from '@storybook/react-native';

import { NavBar, TabKey } from './NavBar';

const meta = {
  title: 'Example/NavBar',
  component: NavBar,
  tags: ['autodocs'],
} satisfies Meta<typeof NavBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HomeTab: Story = {
  args: {
    activeKey: 'home',
    onTabPress: (key: TabKey) => {
      console.log('Tab pressed:', key);
    },
  },
};

export const LoggedOut: Story = {
  args: {
    onLogin: () => {},
    onLogout: () => {},
    onCreateAccount: () => {},
  },
};
