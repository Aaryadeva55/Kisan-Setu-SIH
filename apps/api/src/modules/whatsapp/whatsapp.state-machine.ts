import { Language } from '@kisan-setu/types';
import { prisma } from '../../infra/prisma.js';
import { t, translateCropName } from '../../locales/agriDict.js';
import { recommendationService } from '../recommendation/recommendation.service.js';
import { marketService } from '../market/market.service.js';
import { matchingService } from '../matching/matching.service.js';
import { transactionsService } from '../transactions/transactions.service.js';

export interface StateMachineResponse {
  nextState: string;
  responseText: string;
  updatedContext?: Record<string, any>;
}

export async function processConversationStep(
  user: any,
  currentState: string,
  context: any,
  incomingText: string
): Promise<StateMachineResponse> {
  const lang: Language = user.preferredLang || Language.MARATHI;
  const input = incomingText.trim();
  const lower = input.toLowerCase();

  // Global Keyword Short-Circuits
  if (lower === 'help' || lower === 'मदत' || lower === 'मदद') {
    return {
      nextState: currentState,
      responseText:
        t('status_help', lang) +
        '\n\n' +
        t('main_menu', lang) +
        '\n\n🌐 भाषा बदलण्यासाठी *lang* पाठवा (Type *lang* to change language).',
    };
  }

  // Language Change Shortcuts
  if (
    lower === 'lang' ||
    lower === 'language' ||
    lower === 'भाषा' ||
    lower === 'bhasha'
  ) {
    return {
      nextState: 'LANGUAGE_SELECTION',
      responseText:
        '🌐 कृपया आपली भाषा निवडा / कृपया अपनी भाषा चुनें / Please choose your language:\n1. मराठी (Marathi)\n2. हिंदी (Hindi)\n3. English',
    };
  }

  // Direct Language Switches
  if (lower === 'english' || lower === 'eng') {
    await prisma.user.update({ where: { id: user.id }, data: { preferredLang: Language.ENGLISH } });
    return {
      nextState: 'MAIN_MENU',
      responseText: '🌐 Language updated to *English*.\n\n' + t('main_menu', Language.ENGLISH),
      updatedContext: { ...context, lang: Language.ENGLISH },
    };
  }

  if (lower === 'hindi' || lower === 'हिंदी' || lower === 'हिन्दी') {
    await prisma.user.update({ where: { id: user.id }, data: { preferredLang: Language.HINDI } });
    return {
      nextState: 'MAIN_MENU',
      responseText: '🌐 भाषा बदलकर *हिंदी* कर दी गई है।\n\n' + t('main_menu', Language.HINDI),
      updatedContext: { ...context, lang: Language.HINDI },
    };
  }

  if (lower === 'marathi' || lower === 'मराठी') {
    await prisma.user.update({ where: { id: user.id }, data: { preferredLang: Language.MARATHI } });
    return {
      nextState: 'MAIN_MENU',
      responseText: '🌐 भाषा *मराठी* निवडली आहे.\n\n' + t('main_menu', Language.MARATHI),
      updatedContext: { ...context, lang: Language.MARATHI },
    };
  }

  if (lower === 'reset' || lower === 'start' || lower === 'menu' || lower === 'मेनू') {
    return {
      nextState: 'MAIN_MENU',
      responseText: t('main_menu', lang) + '\n\n🌐 Type *lang* to change language.',
    };
  }

  if (lower === 'status' || lower === 'स्थिती') {
    const activeTxns = await prisma.transaction.findMany({
      where: {
        match: {
          sellIntent: {
            farmer: { userId: user.id },
          },
        },
      },
      include: {
        match: {
          include: {
            sellIntent: { include: { crop: true } },
            buyerRequirement: { include: { buyer: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (activeTxns.length === 0) {
      return {
        nextState: 'MAIN_MENU',
        responseText: 'आपली कोणतीही सक्रिय व्यवहार विनंती नाही.\n\n' + t('main_menu', lang),
      };
    }

    const list = activeTxns
      .map(
        (t) =>
          `• ${t.match.sellIntent.crop.name} (${t.quantityKg} kg) - खरेदीदार: ${t.match.buyerRequirement.buyer.companyName} [स्थिती: ${t.status}]`
      )
      .join('\n');

    return {
      nextState: 'MAIN_MENU',
      responseText: `📋 आपले सक्रिय व्यवहार:\n${list}\n\n` + t('main_menu', lang),
    };
  }

  // Conversation State Machine Transitions
  switch (currentState) {
    case 'START':
    case 'LANGUAGE_SELECTION': {
      let selectedLang = Language.MARATHI;
      if (input.includes('2') || lower.includes('hindi') || lower.includes('हिंदी')) {
        selectedLang = Language.HINDI;
      } else if (input.includes('3') || lower.includes('english')) {
        selectedLang = Language.ENGLISH;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { preferredLang: selectedLang },
      });

      return {
        nextState: 'LOCATION',
        responseText:
          t('welcome', selectedLang) +
          '\n\n' +
          t('select_district', selectedLang) +
          '\n1. Nashik (नाशिक)\n2. Pune (पुणे)\n3. Ahmednagar (अहमदनगर)',
        updatedContext: { ...context, lang: selectedLang },
      };
    }

    case 'LOCATION': {
      let districtName = 'Nashik';
      if (input.includes('2') || lower.includes('pune') || lower.includes('पुणे')) {
        districtName = 'Pune';
      } else if (input.includes('3') || lower.includes('ahmednagar') || lower.includes('अहमदनगर')) {
        districtName = 'Ahmednagar';
      }

      const district = await prisma.district.findFirst({
        where: { name: districtName },
      });

      if (district) {
        await prisma.farmerProfile.upsert({
          where: { userId: user.id },
          update: { districtId: district.id },
          create: {
            userId: user.id,
            districtId: district.id,
            fullName: user.phone,
          },
        });
      }

      return {
        nextState: 'MAIN_MENU',
        responseText: `📍 जिल्हा निवडला: ${districtName}\n\n` + t('main_menu', lang),
        updatedContext: { ...context, districtId: district?.id, districtName },
      };
    }

    case 'MAIN_MENU': {
      if (input.includes('1') || lower.includes('advisory') || lower.includes('सल्ला')) {
        // Crop Advisory Flow
        const advisories = await recommendationService.generateAdvisoryForFarmer(user.id);
        const top = advisories.slice(0, 3);
        const advisoryText = top
          .map(
            (a, idx) =>
              `${idx + 1}. *${translateCropName(a.cropName || 'Crop', lang)}* (जुळणी: ${a.suitabilityScore}%)\n👉 ${a.reason}`
          )
          .join('\n\n');

        return {
          nextState: 'MAIN_MENU',
          responseText: `${t('advisory_intro', lang)}\n\n${advisoryText}\n\nविक्री नोंदणीसाठी '3' पाठवा.`,
        };
      }

      if (input.includes('2') || lower.includes('price') || lower.includes('भाव')) {
        // Market Price Flow
        const crops = await prisma.crop.findMany({ take: 3 });
        const prices = await Promise.all(
          crops.map((c) => marketService.getLatestPrice(c.id, context.districtId))
        );

        const priceText = prices
          .map(
            (p) =>
              `• *${p.crop?.name || 'Crop'}*: ₹${p.modalPrice}/क्विंटल (किमान: ₹${p.minPrice}, कमाल: ₹${p.maxPrice}) [${p.mandi?.name || 'APMC'}]`
          )
          .join('\n');

        return {
          nextState: 'MAIN_MENU',
          responseText: `${t('price_intro', lang)}\n\n${priceText}\n\n` + t('main_menu', lang),
        };
      }

      if (input.includes('3') || lower.includes('sell') || lower.includes('विक्री')) {
        return {
          nextState: 'SELL_INTENT_CROP',
          responseText: 'कृपया आपण विकू इच्छित असलेले पिक निवडा:\n1. Soybean (सोयाबीन)\n2. Onion (कांदा)\n3. Cotton (कापूस)\n4. Tomato (टोमॅटो)\n5. Wheat (गहू)',
        };
      }

      if (input.includes('4') || lower.includes('transaction')) {
        return processConversationStep(user, 'STATUS', context, 'status');
      }

      return {
        nextState: 'MAIN_MENU',
        responseText: t('main_menu', lang),
      };
    }

    case 'SELL_INTENT_CROP': {
      let cropName = 'Soybean';
      if (input.includes('2') || lower.includes('onion') || lower.includes('कांदा')) cropName = 'Onion';
      if (input.includes('3') || lower.includes('cotton') || lower.includes('कापूस')) cropName = 'Cotton';
      if (input.includes('4') || lower.includes('tomato') || lower.includes('टोमॅटो')) cropName = 'Tomato';
      if (input.includes('5') || lower.includes('wheat') || lower.includes('गहू')) cropName = 'Wheat';

      const crop = await prisma.crop.findFirst({ where: { name: cropName } });

      return {
        nextState: 'SELL_INTENT_QTY',
        responseText: `आपण ${translateCropName(cropName, lang)} निवडले आहे.\n\nआपणास किती किलो (Kg) विकायचे आहे? (उदा. 500)`,
        updatedContext: { ...context, selectedCropId: crop?.id, selectedCropName: cropName },
      };
    }

    case 'SELL_INTENT_QTY': {
      const qty = parseFloat(input.replace(/[^0-9.]/g, '')) || 500;
      const farmer = await prisma.farmerProfile.findFirst({ where: { userId: user.id } });

      if (!farmer || !context.selectedCropId) {
        return {
          nextState: 'MAIN_MENU',
          responseText: 'त्रुटी: प्रोफाइल माहिती अपूर्ण आहे.\n\n' + t('main_menu', lang),
        };
      }

      // Create SellIntent
      const sellIntent = await prisma.sellIntent.create({
        data: {
          farmerId: farmer.id,
          cropId: context.selectedCropId,
          quantityKg: qty,
          expectedPrice: 4500,
          status: 'OPEN',
        },
      });

      // Run immediate matching
      const matches = await matchingService.runMatchingForSellIntent(sellIntent.id);

      if (matches.length > 0) {
        const topMatch = matches[0];
        const matchData = await prisma.match.findUnique({
          where: { id: topMatch.id },
          include: {
            buyerRequirement: { include: { buyer: true } },
            sellIntent: { include: { crop: true } },
          },
        });

        const buyerName = matchData?.buyerRequirement.buyer.companyName || 'Verified Agri Buyer';
        const scorePercent = Math.round(topMatch.score * 100);

        return {
          nextState: 'TRANSACTION_CONFIRM',
          responseText:
            t('match_found', lang, {
              buyerName,
              cropName: translateCropName(context.selectedCropName, lang),
              quantity: qty,
              price: 4500,
              score: scorePercent,
            }) +
            '\n\nखरेदीदाराला व्यवहार विनंती पाठवण्यासाठी *1* (होय) पाठवा.',
          updatedContext: { ...context, pendingMatchId: topMatch.id, quantityKg: qty },
        };
      }

      return {
        nextState: 'MAIN_MENU',
        responseText:
          `आपली ${qty} किलो ${context.selectedCropName} विक्री नोंदणी झाली आहे. योग्य खरेदीदार सापडताच आम्ही आपल्याला सूचित करू.\n\n` +
          t('main_menu', lang),
      };
    }

    case 'TRANSACTION_CONFIRM': {
      if (input.includes('1') || lower.includes('yes') || lower.includes('होय')) {
        if (context.pendingMatchId) {
          await transactionsService.createTransaction(user.id, {
            matchId: context.pendingMatchId,
            quantityKg: context.quantityKg || 500,
          });

          return {
            nextState: 'MAIN_MENU',
            responseText:
              '🤝 ' + t('transaction_created', lang) + '\n\n' + t('main_menu', lang),
            updatedContext: { ...context, pendingMatchId: undefined },
          };
        }
      }

      return {
        nextState: 'MAIN_MENU',
        responseText: 'व्यवहार रद्द केला.\n\n' + t('main_menu', lang),
      };
    }

    default:
      return {
        nextState: 'MAIN_MENU',
        responseText: t('main_menu', lang),
      };
  }
}
