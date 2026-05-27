import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import VisitLog from '@/components/VisitLog';
import { deleteVisit, updateVisit } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  deleteVisit: jest.fn(),
  updateVisit: jest.fn(),
}));

describe('VisitLog', () => {
  beforeEach(() => {
    (deleteVisit as jest.Mock).mockResolvedValue(true);
    (updateVisit as jest.Mock).mockResolvedValue({ id: 7 });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('edits and saves a visit', async () => {
    const onChanged = jest.fn().mockResolvedValue(undefined);
    render(
      <VisitLog
        visit={{ id: 7, visit_date: '2026-05-27', rating: 3, notes: 'Fine' }}
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-05-28' } });
    fireEvent.change(screen.getByLabelText('Rating'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateVisit).toHaveBeenCalledWith(7, {
        visit_date: '2026-05-28',
        rating: 5,
        notes: 'Excellent',
      });
      expect(onChanged).toHaveBeenCalled();
    });
  });

  it('deletes a visit only after confirmation', async () => {
    const onChanged = jest.fn().mockResolvedValue(undefined);
    render(
      <VisitLog
        visit={{ id: 7, visit_date: '2026-05-27', rating: null, notes: null }}
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Delete this visit?');
      expect(deleteVisit).toHaveBeenCalledWith(7);
      expect(onChanged).toHaveBeenCalled();
    });
  });

  it('cancels deletion when confirmation is rejected', () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    render(<VisitLog visit={{ id: 7, visit_date: '2026-05-27' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteVisit).not.toHaveBeenCalled();
  });
});
