import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import axios from 'axios';

@ApiTags('Utils')
@Controller('utils')
export class UtilsController {
  /**
   * Resolve short Google Maps URLs (goo.gl, maps.app.goo.gl) to extract coordinates
   */
  @Get('resolve-google-maps-url')
  @ApiOperation({ summary: 'Resolve Google Maps short URL to extract coordinates' })
  @ApiQuery({ name: 'url', description: 'Google Maps URL (short or full)' })
  @ApiResponse({ status: 200, description: 'Coordinates extracted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid URL or unable to extract coordinates' })
  async resolveGoogleMapsUrl(@Query('url') url: string) {
    if (!url || !url.trim()) {
      throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // If it's already a full URL with coordinates, parse it directly
      const directCoords = this.parseGoogleMapsUrl(url);
      if (directCoords) {
        return directCoords;
      }

      // If it's a short URL, try to resolve it
      if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
        // Follow redirects to get the full URL
        // Note: axios follows redirects automatically by default (maxRedirects defaults to 5)
        try {
          const response = await axios.get(url, {
            maxRedirects: 5,
            validateStatus: () => true, // Accept all status codes to handle redirects
          });

          // Extract the final URL (after redirects)
          // axios follows redirects automatically, so we need to check response.request.res.responseUrl
          const finalUrl = response.request?.res?.responseUrl || 
                          response.request?.responseURL || 
                          response.config?.url || 
                          url;

          // Parse the resolved URL
          const coords = this.parseGoogleMapsUrl(finalUrl);
          if (coords) {
            return coords;
          }

          // If parsing failed, try parsing the response URL from headers
          const locationHeader = response.headers?.location;
          if (locationHeader) {
            const coordsFromHeader = this.parseGoogleMapsUrl(locationHeader);
            if (coordsFromHeader) {
              return coordsFromHeader;
            }
          }

          throw new HttpException(
            'Unable to extract coordinates from resolved URL. Please open the link in your browser, copy the full URL from the address bar, and paste it here.',
            HttpStatus.BAD_REQUEST,
          );
        } catch (axiosError: any) {
          // If axios fails, provide helpful error message
          throw new HttpException(
            'Unable to resolve short URL. Please open the link in your browser, copy the full URL from the address bar, and paste it here. Or enter coordinates manually.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      throw new HttpException(
        'Unable to extract coordinates from URL. Please provide a valid Google Maps URL.',
        HttpStatus.BAD_REQUEST,
      );
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error resolving URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Parse Google Maps URL to extract coordinates
   */
  private parseGoogleMapsUrl(url: string): { latitude: number; longitude: number } | null {
    try {
      const urlObj = new URL(url);

      // Format 1: ?q=LAT,LNG
      if (urlObj.searchParams.has('q')) {
        const q = urlObj.searchParams.get('q') || '';
        const coords = q.split(',');
        if (coords.length >= 2) {
          const lat = parseFloat(coords[0].trim());
          const lng = parseFloat(coords[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            return { latitude: lat, longitude: lng };
          }
        }
      }

      // Format 2: /place/.../@LAT,LNG
      const placeMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (placeMatch) {
        const lat = parseFloat(placeMatch[1]);
        const lng = parseFloat(placeMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { latitude: lat, longitude: lng };
        }
      }

      // Format 3: /dir/.../destination=LAT,LNG
      const dirMatch = url.match(/destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (dirMatch) {
        const lat = parseFloat(dirMatch[1]);
        const lng = parseFloat(dirMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { latitude: lat, longitude: lng };
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  }
}
