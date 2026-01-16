import { getKnowledgeContext, BOBOTCHO_DATA } from '@/lib/ai/knowledge-base';

describe('Knowledge Base', () => {
  it('should return a context string containing the promo price', () => {
    const context = getKnowledgeContext();
    expect(context).toContain('60000');
    expect(context).toContain('BOBOTCHO');
  });

  it('should contain the installation fee', () => {
    const context = getKnowledgeContext();
    expect(context).toContain('10000');
  });

  it('should list all benefits', () => {
    const context = getKnowledgeContext();
    BOBOTCHO_DATA.benefits.forEach(benefit => {
      expect(context).toContain(benefit);
    });
  });
});
