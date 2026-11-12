import {loadPresentation,getSlides} from '@office-kit/pptx';
import {renderSlideToSvg} from '@office-kit/pptx-preview';
export async function render(bytes){
  const presentation=await loadPresentation(new Uint8Array(bytes));
  return getSlides(presentation).map(slide=>renderSlideToSvg(presentation,slide));
}
