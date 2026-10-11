"""Derive gem selection budgets from audited native pools and runtime recipes.

Geometric-model estimates, not measured survival production or RNG sampling.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def combined_quantile(p, q, confidence):
    # CDF of two independent geometric counts, each including its success.
    for total in range(2, 10000):
        cdf = sum(p * (1-p)**(first-1) * (1-(1-q)**(total-first))
                  for first in range(1, total))
        if cdf >= confidence:
            return total
    raise ValueError('Quantile outside supported range')


def build(runtime_path):
    runtime = json.loads(Path(runtime_path).read_text())
    pools = runtime['powerPools']
    runic = pools['RUNEFUSED']
    nether = pools['NETHER']
    assert 'simplyswords:slow' in runic and 'simplyswords:greater_slow' in runic
    assert 'simplyswords:onslaught' in nether
    source = json.loads((ROOT / 'docs/RUNE-SOCKET-SOURCES-0.29.json').read_text())
    method = source['bytecode']['registry.GemPowerRegistry']
    assert 'java/util/Random.nextInt:(I)I' in method
    recipes = runtime['recipes']
    assert all(r['meltTicks'] == 500 and r['meltOutputCount'] == 1 for r in recipes)
    estimates = []
    for label, acceptable in [('exact-slow', 1), ('slow-or-greater-slow', 2)]:
        p, q = acceptable/len(runic), 1/len(nether)
        slow_mean, ons_mean = 1/p, 1/q
        total = slow_mean + ons_mean
        estimates.append({
            'selection': label, 'acceptableRunefusedPowers': acceptable,
            'runefusedSuccessProbability': p, 'onslaughtSuccessProbability': q,
            'meanRunefusedCrafts': slow_mean, 'meanNetherfusedCrafts': ons_mean,
            'meanGemCrafts': total,
            'totalGemCraftQuantiles': {str(c): combined_quantile(p, q, c) for c in [0.5, 0.9, 0.95]},
            'meanRunicTabletsForGems': total,
            'meanCryingObsidian': slow_mean, 'meanNetheriteIngots': ons_mean,
            'startingEmpoweredRemnantsWithRecycling': 2,
            'meanFailedGemsToRecycle': total - 2,
            'nominalSerialRecyclingTicks': (total - 2)*500,
            'nominalSerialRecyclingSecondsAt20TPS': (total - 2)*25,
            'meanTabletsIncludingAwakening4': total + 4,
            'meanTabletsIncludingAwakening8': total + 8,
            'fourCopiesMeanTabletsIncludingAwakening8': 4*(total + 8),
        })
    report = {
        'gameVersion': source['gameVersion'], 'auditRevision': '0.30',
        'scope': 'Analytic independent geometric-draw model from uniform nextInt(pool.size), current runtime pools and recipes. Includes success craft; recycle failures retains the starting remnant. Not measured loot, smithing/furnace operation, RNG sample, production throughput or guarantee on any individual player.',
        'excludes': ['finding unique weapons/remnants/tablets', 'initial enchanting', 'mining and crafting additions', 'fuel', 'UI handling', 'travel', 'parallel furnaces', 'server lag'],
        'runtimeEvidenceSha256': hashlib.sha256(Path(runtime_path).read_bytes()).hexdigest(),
        'jar': source['jar'], 'poolSizes': {k:len(v) for k,v in pools.items()},
        'runtimeRecipeChecks': runtime['checks'], 'runtimeRecipes': recipes,
        'estimates': estimates,
    }
    dest = ROOT / 'docs/GEM-ECONOMY-0.30.json'
    dest.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(dest)
    for row in estimates:
        print(row['selection'], row['meanGemCrafts'], row['totalGemCraftQuantiles'])


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('runtime_result')
    build(parser.parse_args().runtime_result)
