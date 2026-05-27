import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TagInput from '@/components/TagInput';

describe('TagInput', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(['coffee', 'museum']),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('adds a trimmed lowercase tag on Enter', async () => {
    const onChange = jest.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const input = screen.getByPlaceholderText('Add a tag...');
    fireEvent.change(input, { target: { value: ' Coffee ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['coffee']);
  });

  it('removes an existing tag', async () => {
    const onChange = jest.fn();
    const { container } = render(<TagInput value={['coffee']} onChange={onChange} />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const removeButton = container.querySelector('button');
    expect(removeButton).not.toBeNull();
    fireEvent.click(removeButton as HTMLButtonElement);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('uses fetched tag suggestions', async () => {
    const onChange = jest.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Add a tag...');
    fireEvent.focus(input);
    fireEvent.click(await screen.findByRole('button', { name: 'coffee' }));

    expect(onChange).toHaveBeenCalledWith(['coffee']);
  });
});
