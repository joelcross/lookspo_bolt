import { TabProvider } from '@/contexts/TabContext';
import TabLayout from './TabLayout';

export default function LayoutWrapper() {
  return (
    <TabProvider>
      <TabLayout />
    </TabProvider>
  );
}
