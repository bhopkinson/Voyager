import { render, screen } from '@testing-library/react';
import PlaceCard from '@/components/PlaceCard';

it('renders place name', () => {
  render(<PlaceCard place={{ id: 1, name: 'Test Place' }} />);
  expect(screen.getByText('Test Place')).toBeInTheDocument();
});
