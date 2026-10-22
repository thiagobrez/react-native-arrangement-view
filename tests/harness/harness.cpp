// Runs cpp/arrange.h on cases read from stdin and writes the frames to
// stdout, for tests/harness/arrange.ts. Each case is IN doubles and each
// result OUT doubles, in the order arrange.ts packs and unpacks them.
#include <arrange.h>

#include <cstdio>
#include <vector>

using namespace arrangementview;

constexpr size_t IN = 19;
constexpr size_t OUT = 9;

int main() {
  std::vector<double> in;
  double buffer[4096];
  size_t read;
  while ((read = fread(buffer, sizeof(double), 4096, stdin)) > 0) {
    in.insert(in.end(), buffer, buffer + read);
  }
  const size_t count = in.size() / IN;
  std::vector<double> out(count * OUT);
  for (size_t i = 0; i < count; i++) {
    const double *r = &in[i * IN];
    Geometry geometry{r[0], r[1], {r[2], r[3]}, std::nullopt};
    if (r[4] != 0) {
      geometry.fold = Fold{
          r[5],
          r[6],
          r[7],
          r[8],
          r[9] != 0 ? FoldOrientation::Vertical : FoldOrientation::Horizontal,
          r[10] != 0,
          r[11] != 0};
    }
    const ArrangeOptions options{
        static_cast<Arrangement>(r[12]),
        static_cast<Axes>(r[13]),
        static_cast<HingePolicy>(r[14]),
        r[15],
        static_cast<HorizontalEdge>(r[16]),
        static_cast<VerticalEdge>(r[17]),
        r[18] != 0};
    const PaneFrames frames = arrange(geometry, options);
    double *w = &out[i * OUT];
    w[0] = frames.primary.left;
    w[1] = frames.primary.top;
    w[2] = frames.primary.width;
    w[3] = frames.primary.height;
    w[4] = frames.secondary ? 1 : 0;
    if (frames.secondary) {
      w[5] = frames.secondary->left;
      w[6] = frames.secondary->top;
      w[7] = frames.secondary->width;
      w[8] = frames.secondary->height;
    }
  }
  fwrite(out.data(), sizeof(double), out.size(), stdout);
  return 0;
}
