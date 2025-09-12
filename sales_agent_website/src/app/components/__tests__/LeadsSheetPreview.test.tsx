import { render, screen } from '@testing-library/react';
import LeadsSheetPreview from '../LeadsSheetPreview';

// Mock the fetch function
global.fetch = jest.fn();

const mockFetchSuccess = () => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        ['Timestamp', 'Name', 'Email', 'Company', 'Message'],
        ['2025-01-05T12:00:00.000Z', 'Ada Lovelace', 'ada@example.com', 'Analytical Engines', 'Interested in a product demo'],
      ]),
    } as Response)
  );
};

const mockFetchFail = () => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.resolve({
      ok: false,
      status: 500,
    } as Response)
  );
};

const mockFetchEmpty = () => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)
  );
};

describe('LeadsSheetPreview', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the fetched data on success', async () => {
    mockFetchSuccess();
    render(await LeadsSheetPreview());

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
  });

  it('renders an error message when fetch fails', async () => {
    mockFetchFail();
    render(await LeadsSheetPreview());

    expect(screen.getByText("Couldn't load data")).toBeInTheDocument();
  });

  it('renders a message when no data is returned', async () => {
    mockFetchEmpty();
    render(await LeadsSheetPreview());

    expect(screen.getByText('No data returned from the sheet.')).toBeInTheDocument();
  });
});