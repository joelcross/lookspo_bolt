import type { Meta, StoryObj } from '@storybook/react-native';

import PostCard from './PostCard';

const meta = {
  title: 'Example/PostCard',
  component: PostCard,
  tags: ['autodocs'],
} satisfies Meta<typeof PostCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FeedPost: Story = {
  args: {
    post: {
      id: '1',
      image_url: 'https://via.placeholder.com/300',
      caption: 'Test Caption',
      user_id: '123',
      created_at: new Date().toISOString(),
      profiles: {
        id: '123',
        username: 'user_123',
        avatar_url: 'https://via.placeholder.com/50',
      },
      is_liked: false,
      is_saved: false,
      pieces: [
        { name: 'Leather Jacket', brand: 'Acme' },
        { name: 'Silk Scarf', brand: 'VintageCo', url: 'https://example.com' },
      ],
    },
    showActions: false,
    onLikeToggle: () => {
      console.log('Like pressed:');
    },
    onSaveToggle: () => {
      console.log('Save toggled:');
    },
  },
};
