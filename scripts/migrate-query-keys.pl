#!/usr/bin/env perl
# Codemod: replace string-array queryKey literals with keys.* refs.
# Idempotent. Usage:
#   perl scripts/migrate-query-keys.pl <files>

use strict;
use warnings;

# (literal, replacement). Each literal becomes a regex matching either
# ['lit'] or ["lit"] with surrounding whitespace.
my @noarg = (
  ['brand-campaigns',         'keys.campaigns.byBrand()'],
  ['brand-campaign-history',  'keys.campaigns.history()'],
  ['tier-counts',             'keys.campaigns.tierCounts()'],
  ['my-proposals',            'keys.campaignCreators.my()'],
  ['recommended-creators',    'keys.creators.recommended()'],
  ['rising-stars',            'keys.creators.risingStars()'],
  ['influencer-profile-own',  'keys.creators.profileOwn()'],
  ['brand-profile',           'keys.brand.profile()'],
  ['brand-analytics',         'keys.brand.analytics()'],
  ['brand-deep-analytics',    'keys.brand.deepAnalytics()'],
  ['brand-transactions',      'keys.brand.transactions()'],
  ['brand-transaction-filters','keys.brand.transactionFilters()'],
  ['recommended-campaigns',   'keys.brand.recommendedCampaigns()'],
  ['account-preferences',     'keys.account.preferences()'],
  ['influencer-analytics',    'keys.analytics.influencer()'],
  ['influencer-deep-analytics','keys.analytics.influencerDeep()'],
  ['monthly-analytics',       'keys.analytics.monthly()'],
  ['gamification-influencer', 'keys.gamification.influencer()'],
  ['connected-platforms',     'keys.platforms.connected()'],
  ['wallet-transactions',     'keys.wallet.transactions()'],
  ['membership-status',       'keys.membership.status()'],
  ['notifications',           'keys.notifications.all()'],
);

my @onearg = (
  ['campaign-influencers',     'keys.campaigns.influencers'],
  ['campaign-videos-admin',    'keys.campaigns.videosAdmin'],
  ['campaign-proposals-track', 'keys.campaignCreators.byCampaign'],
  ['campaign-creator-rating',  'keys.campaignCreators.rating'],
  ['workflow',                 'keys.workflow.detail'],
  ['activityLog',              'keys.workflow.activity'],
  ['similar-influencers',      'keys.creators.similar'],
  ['influencer-profile',       'keys.creators.profile'],
  ['influencer-ratings',       'keys.creators.ratings'],
  ['public-badges',            'keys.creators.publicBadges'],
  ['brand-public',             'keys.brand.publicProfile'],
  ['brand-transactions',       'keys.brand.transactions'],
  ['platform-metrics',         'keys.platforms.metrics'],
);

for my $f (@ARGV) {
  open my $in,  '<', $f or do { warn "skip $f: $!"; next };
  local $/; my $src = <$in>; close $in;
  my $orig = $src;

  # No-arg rules.
  for my $r (@noarg) {
    my ($lit, $repl) = @$r;
    my $esc = quotemeta($lit);
    $src =~ s/\[\s*['"]${esc}['"]\s*\]/$repl/g;
  }

  # One-arg rules: [ 'literal', expr ] -> keys.X.Y(expr).
  for my $r (@onearg) {
    my ($lit, $fn) = @$r;
    my $esc = quotemeta($lit);
    $src =~ s/\[\s*['"]${esc}['"]\s*,\s*([^\]]+?)\s*\]/${fn}($1)/g;
  }

  # Marketplace: 6 destructured params.
  $src =~ s{
    \[\s*['"]marketplace['"]\s*,\s*
    (gender)\s*,\s*(tier)\s*,\s*(platform)\s*,\s*
    (location)\s*,\s*(genreKey)\s*,\s*(debouncedSearch)\s*\]
  }{keys.creators.marketplace({ gender, tier, platform, location, genreKey, debouncedSearch })}gx;

  # Social-stats: 2 args.
  $src =~ s{
    \[\s*['"]social-stats['"]\s*,\s*([^,]+?)\s*,\s*([^\]]+?)\s*\]
  }{keys.creators.socialStats($1, $2)}gx;

  if ($src ne $orig) {
    unless ($src =~ m{from\s+["']\@/lib/queryKeys["']}) {
      if ($src =~ /^((?:import .*?;\n)+)/m) {
        my $imports = $1;
        my $with_added = $imports . "import { keys } from '\@/lib/queryKeys';\n";
        $src =~ s/\Q$imports\E/$with_added/;
      } else {
        $src = "import { keys } from '\@/lib/queryKeys';\n" . $src;
      }
    }
    open my $out, '>', $f or die "write $f: $!";
    print $out $src;
    close $out;
    print "patched $f\n";
  }
}
