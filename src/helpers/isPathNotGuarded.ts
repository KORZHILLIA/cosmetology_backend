import notGuardedPaths from 'src/constants/notGuardedPaths';

const isPathNotGuarded = (path: string): boolean => {
  return notGuardedPaths.some((el) => path.includes(el));
};

export default isPathNotGuarded;
