import { NextRequest, NextResponse } from 'next/server';
import { ChartType } from '../../agents/plan_agent/components/charts/ChartRenderer';

// Define interface for API response
interface SectionWithChartType {
  content: string;
  chartType: ChartType;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { markdown } = body;

    if (!markdown) {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      );
    }

    try {
      // First attempt to call Ollama API to split the markdown with chart recommendations
      const ollamaResponse = await fetch('http://121.78.116.47:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemma3:12b',
          prompt: `
아래에 첨부한 마크다운 문서 내용을 맥락에 맞게 별도의 장으로 나누어서 출력해 주세요.
각 장마다 가장 적합한 차트 유형도 함께 추천해 주세요. 
사용 가능한 차트 유형은 'bar', 'pie', 'line', 'flow' 입니다.

'bar': 항목 간의 비교나 범주형 데이터에 적합
'pie': 비율이나 구성 요소를 보여주는 데 적합
'line': 시간에 따른 변화나 추세를 보여주는 데 적합
'flow': 프로세스, 단계, 또는 관계를 보여주는 데 적합

각 장과 차트 추천을 다음 JSON 형식으로 출력해 주세요:
[
  {"content": "첫 번째 장의 내용...", "chartType": "추천 차트 유형"},
  {"content": "두 번째 장의 내용...", "chartType": "추천 차트 유형"}
]

마크다운 내용:
${markdown}
          `,
          stream: false,
        }),
        // Set a timeout to prevent hanging if the API is unreachable
        signal: AbortSignal.timeout(60000),
      });

      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        try {
          // Try to parse the JSON response from the LLM
          const sectionsJson = extractJsonFromResponse(data.response);
          if (sectionsJson && Array.isArray(sectionsJson)) {
            const processedSections = sectionsJson.map((section: SectionWithChartType) => ({
              content: section.content.trim(),
              chartType: isValidChartType(section.chartType) ? section.chartType : 'bar'
            }));
            return NextResponse.json({ sections: processedSections });
          }
        } catch (error) {
          console.warn('Error parsing JSON from LLM response, falling back to text extraction:', error.message);
          // If JSON parsing fails, fall back to text extraction
          const sections = extractSectionsFromResponse(data.response);
          return NextResponse.json({ sections });
        }
      }
      
      console.warn('Ollama API unavailable, falling back to local splitting');
    } catch (error) {
      console.warn('Error calling Ollama API, falling back to local splitting:', error.message);
    }
    
    // Fallback to local splitting method if Ollama API fails
    const sectionsWithRecommendations = splitMarkdownLocallyWithChartRecommendations(markdown);
    return NextResponse.json({ sections: sectionsWithRecommendations });
    
  } catch (error) {
    console.error('Error processing markdown:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Check if chart type is valid
function isValidChartType(type: string): boolean {
  return ['bar', 'pie', 'line', 'flow'].includes(type);
}

// Extract JSON from LLM response
function extractJsonFromResponse(response: string): any {
  try {
    // Find the first [ and last ] to extract JSON array
    const jsonStart = response.indexOf('[');
    const jsonEnd = response.lastIndexOf(']') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonString = response.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    }
    return null;
  } catch (error) {
    console.error('Failed to extract JSON from response:', error);
    return null;
  }
}

// Helper function to extract sections from the LLM response
function extractSectionsFromResponse(response: string): SectionWithChartType[] {
  // Split by markdown heading indicators (# or ## or ### etc.)
  const headingRegex = /^#{1,6}\s+/gm;
  
  // First, find all heading positions
  const matches = [...response.matchAll(headingRegex)];
  const positions = matches.map(match => match.index);
  
  if (positions.length === 0) {
    // If no headings found, return the whole content as one section
    return [{ 
      content: response.trim(),
      chartType: guessChartTypeFromContent(response)
    }];
  }
  
  // Extract sections based on heading positions
  const sections: SectionWithChartType[] = [];
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i < positions.length - 1 ? positions[i + 1] : response.length;
    const content = response.substring(start, end).trim();
    sections.push({
      content,
      chartType: guessChartTypeFromContent(content)
    });
  }
  
  return sections;
}

// Local function to split markdown into logical sections with chart recommendations
function splitMarkdownLocallyWithChartRecommendations(markdown: string): SectionWithChartType[] {
  // Identify major headings and split by them
  const headingRegex = /^#{1,2}\s+(.+)$/gm;
  
  // Find all major heading positions
  const matches = [...markdown.matchAll(headingRegex)];
  const positions = matches.map(match => match.index);
  
  if (positions.length === 0) {
    // If no headings found, try to split by logical separators like newlines
    return splitByParagraphGroupsWithChartTypes(markdown);
  }
  
  // Extract sections based on heading positions
  const sections: SectionWithChartType[] = [];
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i < positions.length - 1 ? positions[i + 1] : markdown.length;
    const content = markdown.substring(start, end).trim();
    sections.push({
      content,
      chartType: guessChartTypeFromContent(content)
    });
  }
  
  return sections;
}

// Split text by paragraph groups when no headings are found
function splitByParagraphGroupsWithChartTypes(text: string): SectionWithChartType[] {
  // Look for double newlines which typically separate paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  
  if (paragraphs.length <= 2) {
    // Not enough paragraphs to group meaningfully
    return [{ 
      content: text,
      chartType: guessChartTypeFromContent(text)
    }];
  }
  
  // Group paragraphs into logical sections (around 2-4 paragraphs per section)
  const sections: SectionWithChartType[] = [];
  const paragraphsPerSection = Math.max(2, Math.min(4, Math.ceil(paragraphs.length / 3)));
  
  for (let i = 0; i < paragraphs.length; i += paragraphsPerSection) {
    const sectionParagraphs = paragraphs.slice(i, i + paragraphsPerSection);
    const content = sectionParagraphs.join('\n\n');
    sections.push({
      content,
      chartType: guessChartTypeFromContent(content)
    });
  }
  
  return sections;
}

// Guess the most appropriate chart type based on content analysis
function guessChartTypeFromContent(content: string): ChartType {
  const hasTimeSeries = /(?:over time|trend|growth|decline|increase|decrease|연도|기간|year|month|day|주기)/i.test(content);
  const hasComparison = /(?:comparison|versus|vs\.|compare|비교|대조|차이|compared to)/i.test(content);
  const hasPercentages = /(?:\d+%|percent|percentage|비율|분포|distribution|portion|share|점유율)/i.test(content);
  const hasProcess = /(?:flow|process|sequence|step|procedure|단계|절차|과정|workflow|흐름도|순서)/i.test(content);
  
  // Check for numeric lists that would suit bar charts
  const hasBulletedValues = /[-*]\s+[^:]+:\s*\d+/.test(content);
  
  if (hasProcess) return 'flow';
  if (hasTimeSeries) return 'line';
  if (hasPercentages) return 'pie';
  if (hasComparison || hasBulletedValues) return 'bar';
  
  return 'bar'; // Default to bar chart
} 