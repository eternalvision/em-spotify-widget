import { tags } from 'ecmact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '#widget/widget.ts';
import { mountConfigurator } from '#widget/configurator/configurator.ts';
import { resetValues } from '#widget/configurator/state.ts';
import { deepAll } from '../deep.ts';

const find = (selector: string): HTMLElement => {
  const found = deepAll(document.body, selector).at(0);
  if (!found) {
    throw new Error(`nothing matches ${selector}`);
  }
  return found;
};

const snippet = (): string => find('[data-part="snippet"]').textContent;

const key = (element: HTMLElement, name: string): void => {
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true }));
};

const typeInto = (element: HTMLElement, text: string): void => {
  element.textContent = text;
  element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

const pickTab = (label: string): void => {
  deepAll(document.body, '[role="tab"]')
    .find((tab) => tab.textContent === label)
    ?.click();
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ state: 'idle', fetchedAt: 1, track: null }))),
    ),
  );
  resetValues();
  document.body.append(tags.div({ id: 'app', shadow: false }));
  mountConfigurator('#app');
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('configurator', () => {
  it('starts with a snippet that has no options', () => {
    expect(snippet()).toContain('<spotify-widget></spotify-widget>');
  });

  it('uses no native form controls at all', () => {
    expect(deepAll(document.body, 'input, select, textarea, button, option')).toHaveLength(0);
  });

  it('picks an option from the custom select with the mouse', () => {
    find('[role="combobox"][aria-label="Theme"]').click();
    const light = deepAll(document.body, '[role="option"]').find(
      (item) => item.textContent === 'light',
    );
    light?.click();
    expect(snippet()).toContain('theme="light"');
  });

  it('picks an option from the custom select with the keyboard', () => {
    const trigger = find('[role="combobox"][aria-label="Layout"]');
    key(trigger, 'ArrowDown');
    key(trigger, 'ArrowDown');
    key(trigger, 'Enter');
    expect(snippet()).toContain('layout="horizontal"');
  });

  it('hides and shows a part with its chip', () => {
    const chip = deepAll(document.body, '[role="checkbox"]').find(
      (item) => item.textContent === 'cover',
    );
    chip?.click();
    expect(snippet()).toContain('hide="cover"');
    chip?.click();
    expect(snippet()).toContain('<spotify-widget></spotify-widget>');
  });

  it('turns a switch off and back to its default', () => {
    const toggle = find('[role="switch"][aria-checked="true"]');
    toggle.click();
    expect(snippet()).toContain('link="false"');
    toggle.click();
    expect(snippet()).not.toContain('link=');
  });

  it('moves a slider with the keyboard', () => {
    const slider = find('[role="slider"][aria-label="Corner radius"]');
    key(slider, 'ArrowRight');
    expect(snippet()).toContain('radius="19"');
    key(slider, 'End');
    expect(snippet()).toContain('radius="48"');
  });

  it('takes a color typed into the custom text field', () => {
    typeInto(find('[role="textbox"][aria-label="Accent"]'), '#FF0000');
    expect(snippet()).toContain('accent="FF0000"');
  });

  it('takes a color from the palette', () => {
    find('[role="button"][aria-label="Accent palette"]').click();
    deepAll(find('[role="group"][aria-label="Accent presets"]'), '[aria-label="#ff5c5c"]')
      .at(0)
      ?.click();
    expect(snippet()).toContain('accent="ff5c5c"');
  });

  it('writes the snippet of the selected tab', () => {
    const iframeTab = deepAll(document.body, '[role="tab"]').find(
      (tab) => tab.textContent === 'Iframe',
    );
    iframeTab?.click();
    expect(snippet()).toMatch(/^<iframe /);
    const imageTab = deepAll(document.body, '[role="tab"]').find(
      (tab) => tab.textContent === 'Image',
    );
    imageTab?.click();
    expect(snippet()).toMatch(/^<img /);
  });

  it('switches to another widget with its own tag, address and options', () => {
    find('[role="combobox"][aria-label="Widget"]').click();
    deepAll(document.body, '[role="option"]')
      .find((item) => item.textContent === 'Top tracks')
      ?.click();
    expect(snippet()).toContain('<spotify-top-tracks></spotify-top-tracks>');
    pickTab('Iframe');
    expect(snippet()).toContain('/embed?widget=top-tracks');
    pickTab('Image');
    expect(snippet()).toContain('Now playing card only');
  });

  it('leaves out options the widget does not understand', () => {
    const slider = find('[role="slider"][aria-label="Corner radius"]');
    key(slider, 'ArrowRight');
    find('[role="combobox"][aria-label="Widget"]').click();
    deepAll(document.body, '[role="option"]')
      .find((item) => item.textContent === 'Profile card')
      ?.click();
    expect(snippet()).not.toContain('count=');
    expect(snippet()).toContain('radius="19"');
  });

  it('shows the widget in the preview', () => {
    expect(deepAll(document.body, 'spotify-widget')).toHaveLength(1);
  });
});
