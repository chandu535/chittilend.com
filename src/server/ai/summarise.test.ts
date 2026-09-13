import { describe, it, expect } from 'vitest';
import { summariseRows, rowSentences } from './summarise';

/**
 * The spoken half of an answer, and the reason it is not written by a model.
 *
 * A model was asked to describe these rows using only the numbers in them, and instructed
 * not to calculate. It calculated: eight instalments of ₹2,500 were reported as a total of
 * ₹57,191, and the same data phrased for a different question came back as ₹2,03,620. Both
 * were fluent and confident, and the rows on screen were right the whole time — so nothing
 * on the page contradicted the sentence a collector would act on.
 *
 * These tests exist to keep the arithmetic here.
 */
describe('summariseRows', () => {
  const instalments = (n: number, each: string) =>
    Array.from({ length: n }, (_, i) => ({
      name: `p${i}`, loan_number: 100 + i, amount_owed: each,
    }));

  describe('the case that was being got wrong', () => {
    it('adds eight instalments of 2,500 to exactly 20,000', () => {
      const said = summariseRows(instalments(8, '2500.00'));
      // ఇరవై వేలు — twenty thousand, not the ₹57,191 a model produced from these rows.
      expect(said).toContain('ఇరవై వేలు');
      expect(said).toContain('ఎనిమిది ఫలితాలు');
    });

    it('gives the same answer every time it is asked', () => {
      const rows = instalments(8, '2500.00');
      const answers = new Set(Array.from({ length: 5 }, () => summariseRows(rows)));
      expect(answers.size).toBe(1);
    });
  });

  describe('a single value is the answer, not a row count', () => {
    it('reads a lone count as the number itself', () => {
      // "ఎంత మంది అప్పుదారులు ఉన్నారు" returns one row holding 16.
      expect(summariseRows([{ borrower_count: '16' }])).toBe('పదహారు.');
    });

    it('says rupees when that lone value is money', () => {
      expect(summariseRows([{ total_owed: '20000' }])).toBe('ఇరవై వేలు రూపాయలు.');
    });

    it('passes a lone piece of text straight through', () => {
      expect(summariseRows([{ area: 'Bhimavaram' }])).toBe('Bhimavaram.');
    });
  });

  describe('which columns get totalled', () => {
    it('adds money columns', () => {
      const said = summariseRows([
        { amount_due: '1000' }, { amount_due: '1500' },
      ]);
      expect(said).toContain('రెండు వేల ఐదు వందలు');
    });

    it('never adds up identifiers', () => {
      /*
        loan_number and installment_number are numeric and summing them yields a confident,
        meaningless figure. 100 + 101 + 102 = 303 is not a fact about anything.
      */
      const said = summariseRows([
        { loan_number: 100, installment_number: 1 },
        { loan_number: 101, installment_number: 2 },
        { loan_number: 102, installment_number: 3 },
      ]);
      expect(said).toBe('మూడు ఫలితాలు.');
    });

    it('never adds up mobile numbers', () => {
      const said = summariseRows([{ mobile: '9441874929' }, { mobile: '8247050250' }]);
      expect(said).toBe('రెండు ఫలితాలు.');
    });

    it('does not call a single row a total', () => {
      // One value is already visible in the row; announcing it as a sum adds nothing.
      const said = summariseRows([{ name: 'x', amount_owed: '2500' }]);
      expect(said).toBe('ఒకటి ఫలితాలు.');
    });
  });

  describe('ragged data', () => {
    it('ignores values that are not numbers', () => {
      const said = summariseRows([
        { amount_paid: '1000' }, { amount_paid: null }, { amount_paid: '500' },
      ]);
      expect(said).toContain('వెయ్యి ఐదు వందలు');
    });

    it('handles an empty result', () => {
      expect(summariseRows([])).toBe('ఏమీ దొరకలేదు.');
    });

    it('totals a money column whatever the model decided to call it', () => {
      /*
        The model names its own aggregate columns, and both of this filter's bugs were
        columns it invented: `amount_paid` (excluded for ending in "id") and
        `amount_owed_this_month` (excluded for containing "month"). Each silently dropped a
        real total, so the sentence reported a row count and no money at all.
      */
      for (const column of [
        'amount_owed_this_month', 'amount_paid', 'total_due', 'outstanding_balance',
        'sum_amount_due', 'amount_owed',
      ]) {
        const said = summariseRows([{ [column]: '1000' }, { [column]: '1500' }]);
        expect(said, column).toContain('మొత్తం');
        expect(said, column).toContain('రెండు వేల ఐదు వందలు');
      }
    });

    it('still refuses to total the counts that wear money words', () => {
      // `total_installments` is a count, not an amount, despite the word "total".
      expect(summariseRows([{ total_installments: 5 }, { total_installments: 12 }]))
        .toBe('రెండు ఫలితాలు.');
      expect(summariseRows([{ installment_number: 1 }, { installment_number: 2 }]))
        .toBe('రెండు ఫలితాలు.');
    });

    it('does total the instalment amount, which is money', () => {
      const said = summariseRows([{ installment_amount: '2500' }, { installment_amount: '2500' }]);
      expect(said).toContain('ఐదు వేలు');
    });

    it('rounds paise rather than reading them out', () => {
      const said = summariseRows([{ amount_due: '4166.67' }, { amount_due: '4166.67' }]);
      expect(said).toContain('ఎనిమిది వేల మూడు వందల ముప్పై మూడు');
    });
  });
});

/**
 * Reading the list out.
 *
 * The summary alone was the answer once, on the reasoning that a long list cannot be
 * followed by ear. That reasoning was about the wrong person: someone who asks "who has not
 * paid" and cannot read the screen has been told nothing by a count of eight. The list is
 * the answer.
 */
describe('rowSentences', () => {
  it('reads a name and the amount beside it', () => {
    expect(rowSentences([{ name: 'సురేష్', amount_owed: '2500' }]))
      .toEqual(['సురేష్, రెండు వేల ఐదు వందలు']);
  });

  it('prefers the Telugu spelling when the query returned both', () => {
    const said = rowSentences([{ name: 'Suresh', name_telugu: 'సురేష్', amount_due: '5000' }]);
    expect(said).toEqual(['సురేష్, ఐదు వేలు']);
  });

  it('reads the name alone when there is no amount', () => {
    expect(rowSentences([{ name: 'సురేష్', mobile: '9441874929' }])).toEqual(['సురేష్']);
  });

  it('gives one line per person', () => {
    const rows = [
      { name: 'ఒకటి', amount_owed: '2500' },
      { name: 'రెండు', amount_owed: '5000' },
      { name: 'మూడు', amount_owed: '7500' },
    ];
    expect(rowSentences(rows)).toHaveLength(3);
    expect(rowSentences(rows)[2]).toBe('మూడు, ఏడు వేల ఐదు వందలు');
  });

  it('says nothing where there is no name to say', () => {
    // A count or a total has no list in it, and inventing one would be worse than silence.
    expect(rowSentences([{ borrower_count: '16' }])).toEqual([]);
    expect(rowSentences([])).toEqual([]);
  });

  it('skips a row whose name is missing rather than saying an empty line', () => {
    const said = rowSentences([
      { name: 'సురేష్', amount_owed: '2500' },
      { name: null, amount_owed: '5000' },
      { name: '  ', amount_owed: '1000' },
    ]);
    expect(said).toEqual(['సురేష్, రెండు వేల ఐదు వందలు']);
  });

  it('finds a name column the model named itself', () => {
    expect(rowSentences([{ borrower_name: 'సురేష్', total_due: '2500' }]))
      .toEqual(['సురేష్, రెండు వేల ఐదు వందలు']);
  });
});
