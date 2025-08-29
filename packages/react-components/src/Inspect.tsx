// Copyright 2017-2025 @polkadot/app-extrinsics authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Inspect } from '@polkadot/types/types';

import React, { useMemo } from 'react';

import { useApi } from '@polkadot/react-hooks';
import { u8aToHex } from '@polkadot/util';

import Output from './Output.js';
import { styled } from './styled.js';
import { useTranslation } from './translate.js';

interface Props {
  className?: string;
  hex?: string | null;
  inspect?: Inspect | null;
  label: React.ReactNode;
}

interface Inspected {
  name: string;
  value: string;
}

function formatInspect ({ inner = [], name = '', outer = [] }: Inspect, result: Inspected[] = []): Inspected[] {
  if (outer.length) {
    const value = new Array<string>(outer.length);

    for (let i = 0; i < outer.length; i++) {
      value[i] = u8aToHex(outer[i], undefined, false);
    }

    result.push({ name, value: value.join(' ') });
  }

  for (let i = 0, count = inner.length; i < count; i++) {
    formatInspect(inner[i], result);
  }

  return result;
}

function decodeLeU128HexToDateString (hexOrRaw: string): string | null {
  try {
    const clean = hexOrRaw.startsWith('0x') ? hexOrRaw.slice(2) : hexOrRaw.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length !== 32) return null; // 16 bytes
    const bytes = clean.match(/../g)!.
      map((b) => parseInt(b, 16));
    const beHex = bytes.reverse().
      map((b) => b.toString(16).padStart(2, '0')).
      join('');
    const nanos = BigInt('0x' + beHex);
    const millis = nanos / 1_000_000n;
    return new Date(Number(millis)).toLocaleString();
  } catch {
    return null;
  }
}

function decodeLeU32ToNumber (hexOrRaw: string): number | null {
  try {
    const clean = hexOrRaw.startsWith('0x') ? hexOrRaw.slice(2) : hexOrRaw.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length !== 8) return null; // 4 bytes
    const bytes = clean.match(/../g)!.
      map((b) => parseInt(b, 16));
    const value = (bytes[0]) | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
    return value >>> 0;
  } catch {
    return null;
  }
}

function DecodedInspect ({ className, hex, inspect, label }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const { createLink } = useApi();
  const formatted = useMemo(
    () => inspect && formatInspect(inspect),
    [inspect]
  );
  const [link, path] = useMemo(
    (): [null | string, null | string] => {
      if (hex) {
        const path = `/extrinsics/decode/${hex}`;

        return [createLink(path), `#${path}`];
      }

      return [null, null];
    },
    [createLink, hex]
  );

  if (!formatted) {
    return null;
  }

  return (
    <StyledOutput
      className={className}
      isDisabled
      label={label}
    >
      <table>
        <tbody>
          {formatted.map(({ name, value }, i) => {
            let pretty: string | null = null;
            if (name.toLowerCase().includes('nanotimestamp') || name.toLowerCase().includes('nano_timestamp')) {
              pretty = decodeLeU128HexToDateString(value);
            } else if (name.toLowerCase().includes('timerpckeyid') || name.toLowerCase().includes('timerpc_key_id')) {
              const n = decodeLeU32ToNumber(value);
              pretty = n !== null ? String(n) : null;
            }

            return (
              <tr key={i}>
                <td><label>{name}</label></td>
                <td>
                  {value}
                  {pretty && (
                    <div style={{ opacity: 0.8 }}>
                      ({pretty})
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {link && (
            <tr
              className='isLink'
              key='hex'
            >
              <td><label>{t('link')}</label></td>
              <td>
                <a
                  href={link}
                  rel='noreferrer'
                  target='_blank'
                >{path}</a>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </StyledOutput>
  );
}

const StyledOutput = styled(Output)`
  table {
    width: 100%;

    tbody {
      width: 100%;

      tr {
        width: 100%;

        td {
          vertical-align: top;
        }

        td:first-child {
          text-align: right;
          vertical-align: middle;
          white-space: nowrap;

          label {
            padding: 0 0.5rem 0 1.25rem;
          }
        }

        &:not(.isLink) td:last-child {
          font: var(--font-mono);
          width: 100%;
        }

        &.isLink td {
          &:last-child {
            max-width: 0;
          }

          a {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
`;

export default React.memo(DecodedInspect);
