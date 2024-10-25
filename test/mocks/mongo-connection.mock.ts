export const mockMongoConnection = {
  dropDatabase: jest.fn(),
  close: jest.fn(),
};

export const getConnectionToken = jest.fn().mockReturnValue('DatabaseConnection');
