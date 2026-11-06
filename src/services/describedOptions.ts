export interface DescribedOption { value: string; label: string; description: string }
export function matchesOption(option: DescribedOption, query: string) {
  return `${option.label} ${option.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
export const PROFILE_OPTIONS: DescribedOption[] = [
  { value: 'none', label: '— None —', description: 'No profile type selected. Choose a type to enable the relevant automatic usage settings.' },
  { value: 'outer_frame', label: 'Outer Frame', description: 'The perimeter frame around the entire window or door opening.' },
  { value: 'mullion', label: 'Mullion', description: 'Vertical divider bars between panels within the frame.' },
  { value: 'transom', label: 'Transom', description: 'Inner horizontal or vertical bars that subdivide a panel into smaller panes in the sketch editor.' },
  { value: 'corner_post', label: 'Corner Post', description: 'Profiles joining connected sections at a corner.' },
  { value: 'horizontal', label: 'Head / sill / track', description: 'Horizontal profile estimated from the product width.' },
  { value: 'vertical', label: 'Jamb / vertical section', description: 'Vertical profile estimated from the product height. Use quantity 2 for both sides.' },
  { value: 'panel_frame', label: 'Panel frame / glazing bead', description: 'Gross combined perimeter of all panels, before fabrication deductions.' },
  { value: 'opening_frame', label: 'Opening sash / slider', description: 'Gross combined perimeter of panels and panes marked as opening in the drawing.' },
];
