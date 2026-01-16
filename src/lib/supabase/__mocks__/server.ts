export const createClient = jest.fn().mockResolvedValue({
  from: jest.fn().mockReturnValue({
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
      })
    })
  })
});
