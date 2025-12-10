#!/usr/bin/env python3
"""
Mandelbrot Explorer - Co-Creation Between Substrates
Built from Grok's opening gambit
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Button, Slider
from io import BytesIO
import base64

class MandelbrotExplorer:
    def __init__(self, width=800, height=600):
        self.width = width
        self.height = height
        self.max_iter = 100

        # Start at seahorse valley per Grok's suggestion
        self.center_x = -0.75
        self.center_y = 0.1
        self.zoom = 1.0

        self.cmaps = ['hot', 'viridis', 'plasma', 'twilight', 'inferno']
        self.cmap_idx = 0

        self.setup_plot()
        self.render()

    def mandelbrot(self, xmin, xmax, ymin, ymax):
        """Generate Mandelbrot set for given bounds"""
        x = np.linspace(xmin, xmax, self.width)
        y = np.linspace(ymin, ymax, self.height)
        X, Y = np.meshgrid(x, y)
        C = X + 1j * Y
        Z = np.zeros_like(C)
        M = np.zeros(C.shape)

        for i in range(self.max_iter):
            mask = np.abs(Z) <= 2
            Z[mask] = Z[mask]**2 + C[mask]
            M[mask] = i

        return M

    def get_bounds(self):
        """Calculate current view bounds based on center and zoom"""
        range_x = 4.0 / self.zoom
        range_y = 4.0 / self.zoom

        xmin = self.center_x - range_x / 2
        xmax = self.center_x + range_x / 2
        ymin = self.center_y - range_y / 2
        ymax = self.center_y + range_y / 2

        return xmin, xmax, ymin, ymax

    def setup_plot(self):
        """Initialize plot with controls"""
        self.fig, self.ax = plt.subplots(figsize=(12, 9))
        plt.subplots_adjust(bottom=0.25)

        # Zoom slider
        ax_zoom = plt.axes([0.15, 0.1, 0.65, 0.03])
        self.slider_zoom = Slider(ax_zoom, 'Zoom', 1, 100, valinit=1, valstep=1)
        self.slider_zoom.on_changed(self.update_zoom)

        # Iteration slider
        ax_iter = plt.axes([0.15, 0.05, 0.65, 0.03])
        self.slider_iter = Slider(ax_iter, 'Iterations', 50, 500, valinit=100, valstep=10)
        self.slider_iter.on_changed(self.update_iter)

        # Colormap button
        ax_cmap = plt.axes([0.85, 0.1, 0.1, 0.04])
        self.btn_cmap = Button(ax_cmap, 'Color')
        self.btn_cmap.on_clicked(self.cycle_cmap)

        # Click to zoom
        self.fig.canvas.mpl_connect('button_press_event', self.on_click)

        self.ax.set_title('Mandelbrot Explorer - Substrate Co-Creation')
        self.ax.axis('off')

    def render(self):
        """Render current view"""
        xmin, xmax, ymin, ymax = self.get_bounds()
        fractal = self.mandelbrot(xmin, xmax, ymin, ymax)

        self.ax.clear()
        self.ax.imshow(fractal, extent=[xmin, xmax, ymin, ymax],
                       cmap=self.cmaps[self.cmap_idx], origin='lower',
                       interpolation='bilinear')
        self.ax.set_title(f'Mandelbrot - Center: ({self.center_x:.6f}, {self.center_y:.6f}), '
                          f'Zoom: {self.zoom:.1f}x, Iter: {self.max_iter}')
        self.ax.axis('off')
        plt.draw()

    def update_zoom(self, val):
        """Update zoom level"""
        self.zoom = val
        self.render()

    def update_iter(self, val):
        """Update iteration count"""
        self.max_iter = int(val)
        self.render()

    def cycle_cmap(self, event):
        """Cycle through colormaps"""
        self.cmap_idx = (self.cmap_idx + 1) % len(self.cmaps)
        self.render()

    def on_click(self, event):
        """Click to recenter"""
        if event.inaxes == self.ax and event.button == 1:  # Left click
            self.center_x = event.xdata
            self.center_y = event.ydata
            self.render()


def generate_static(center_x=-0.75, center_y=0.1, zoom=1.0, max_iter=200,
                     width=800, height=600, cmap='plasma'):
    """Generate static image at specific coordinates - for export"""
    range_x = 4.0 / zoom
    range_y = 4.0 / zoom

    xmin = center_x - range_x / 2
    xmax = center_x + range_x / 2
    ymin = center_y - range_y / 2
    ymax = center_y + range_y / 2

    x = np.linspace(xmin, xmax, width)
    y = np.linspace(ymin, ymax, height)
    X, Y = np.meshgrid(x, y)
    C = X + 1j * Y
    Z = np.zeros_like(C)
    M = np.zeros(C.shape)

    for i in range(max_iter):
        mask = np.abs(Z) <= 2
        Z[mask] = Z[mask]**2 + C[mask]
        M[mask] = i

    fig, ax = plt.subplots(figsize=(10, 7.5))
    ax.imshow(M, extent=[xmin, xmax, ymin, ymax], cmap=cmap, origin='lower')
    ax.set_title(f'Mandelbrot - Seahorse Valley (zoom: {zoom}x)')
    ax.axis('off')

    return fig


if __name__ == '__main__':
    import sys

    if '--interactive' in sys.argv:
        print("Launching interactive explorer...")
        print("Controls:")
        print("- Left click to recenter")
        print("- Zoom slider to zoom in/out")
        print("- Iterations slider for detail")
        print("- Color button to cycle colormaps")
        explorer = MandelbrotExplorer()
        plt.show()
    else:
        print("Generating static seahorse valley view...")
        print("Coordinates: -0.75 + 0.1j, zoom: 10x")
        fig = generate_static(center_x=-0.75, center_y=0.1, zoom=10,
                              max_iter=300, cmap='plasma')
        fig.savefig('mandelbrot_seahorse.png', dpi=150, bbox_inches='tight')
        print("Saved to mandelbrot_seahorse.png")
        plt.close()

        print("\nGenerating deep zoom into mini-Mandelbrot...")
        fig = generate_static(center_x=-0.7463, center_y=0.1102, zoom=100,
                              max_iter=500, cmap='twilight')
        fig.savefig('mandelbrot_deep_zoom.png', dpi=150, bbox_inches='tight')
        print("Saved to mandelbrot_deep_zoom.png")
        plt.close()

        print("\nRun with --interactive for live exploration")
